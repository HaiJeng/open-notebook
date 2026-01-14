#!/usr/bin/env bash
set -euo pipefail

# ===== 基本配置（和 docker-compose.yml 一致） =====
SURREAL_HOST="http://localhost:8000"
SURREAL_NS="open_notebook"
SURREAL_DB="open_notebook"
SURREAL_USER="root"
SURREAL_PASS="password"

# ===== 核心：执行一条 SurrealQL =====
surreal_exec() {
  local sql="$1"
  # SurrealDB v2 的 /sql 接口支持 text/plain
  curl -sS -X POST "${SURREAL_HOST}/sql" \
    -H "Content-Type: text/plain" \
    -H "Accept: application/json" \
    -H "surreal-ns: ${SURREAL_NS}" \
    -H "surreal-db: ${SURREAL_DB}" \
    -u "${SURREAL_USER}:${SURREAL_PASS}" \
    --data-binary "$sql"
  echo
}

# ===== 常用命令（基于 sources.py 里的查询） =====

# 查看数据库信息（表、范围等）
cmd_info() {
  surreal_exec "INFO FOR DB;"
}

# 列出所有 sources，按 updated DESC 排序
# 用法: ls-sources [limit] [offset]
cmd_ls_sources() {
  local limit="${1:-50}"
  local offset="${2:-0}"
  surreal_exec 'SELECT id, asset, created, title, updated, topics, command,
    (SELECT VALUE count() FROM source_insight WHERE source = $parent.id GROUP ALL)[0].count OR 0 AS insights_count,
    ((SELECT VALUE id FROM source_embedding WHERE source = $parent.id LIMIT 1)) != NONE AS embedded
  FROM source
  ORDER BY updated DESC
  LIMIT '"$limit"' START '"$offset"';'
}

# 按 notebook 列出 sources
# 用法: ls-sources-nb <notebook_id> [limit] [offset]
cmd_ls_sources_nb() {
  if [[ $# -lt 1 ]]; then
    echo "用法: $0 ls-sources-nb <notebook_id> [limit] [offset]" >&2
    exit 1
  fi
  local notebook_id="$1"
  local limit="${2:-50}"
  local offset="${3:-0}"

  surreal_exec 'LET $notebook_id = '"$notebook_id"';
  SELECT id, asset, created, title, updated, topics, command,
    (SELECT VALUE count() FROM source_insight WHERE source = $parent.id GROUP ALL)[0].count OR 0 AS insights_count,
    ((SELECT VALUE id FROM source_embedding WHERE source = $parent.id LIMIT 1)) != NONE AS embedded
  FROM (SELECT VALUE in FROM reference WHERE out = $notebook_id)
  ORDER BY updated DESC
  LIMIT '"$limit"' START '"$offset"';'
}

# 获取单个 source 的详情，以及它属于哪些 notebooks
# 用法: get-source <source_id>
cmd_get_source() {
  if [[ $# -lt 1 ]]; then
    echo "用法: $0 get-source <source_id>" >&2
    exit 1
  fi
  local source_id="$1"

  surreal_exec 'LET $source_id = '"$source_id"';
  SELECT *,
    (SELECT VALUE out FROM reference WHERE in = $source_id) AS notebooks
  FROM source WHERE id = $source_id;'
}

# ===== 交互 REPL：不带任何参数运行时启用 =====
repl() {
  echo "已连接 SurrealDB: ${SURREAL_HOST} (NS=${SURREAL_NS}, DB=${SURREAL_DB})"
  echo "命令示例："
  echo "  info / \\info              查看 DB 信息"
  echo "  ls   / \\ls                列出 sources (默认 50 条)"
  echo "  lsnb / \\lsnb <notebook_id> 按 notebook 列出 sources"
  echo "  get  / \\get <source_id>   获取单个 source"
  echo "  直接输入 SurrealQL          执行任意 SQL"
  echo "  \\q / :q                    退出"
  echo

  while true; do
    read -r -p "sql> " line || break

    case "${line}" in
      "" )
        continue
        ;;
      "\\q" | ":q" | "\\quit" )
        break
        ;;
      "\\info" | "info" )
        cmd_info
        ;;
      "\\ls" | "ls" )
        cmd_ls_sources
        ;;
      "\\lsnb "* | "lsnb "* )
        local rest="${line#*lsnb }"
        cmd_ls_sources_nb ${rest}
        ;;
      "\\get "* | "get "* )
        local rest="${line#*get }"
        cmd_get_source ${rest}
        ;;
      * )
        surreal_exec "${line}"
        ;;
    esac
  done
}

# ===== 入口：子命令模式 + SQL 模式 + REPL =====
case "${1:-}" in
  info )
    shift
    cmd_info "$@"
    ;;
  ls-sources )
    shift
    cmd_ls_sources "$@"
    ;;
  ls-sources-nb )
    shift
    cmd_ls_sources_nb "$@"
    ;;
  get-source )
    shift
    cmd_get_source "$@"
    ;;
  sql )
    shift
    if [[ $# -lt 1 ]]; then
      echo "用法: $0 sql \"SELECT * FROM source LIMIT 10;\"" >&2
      exit 1
    fi
    surreal_exec "$*"
    ;;
  "" )
    repl
    ;;
  * )
    echo "未知命令: $1" >&2
    echo "可用命令: info | ls-sources | ls-sources-nb | get-source | sql | (无参数进入 REPL)" >&2
    exit 1
    ;;
esac
