#!/usr/bin/env python3
"""
Prisma Schema Generator for NEET Coaching Platform
Extracts CREATE TABLE / CREATE TYPE from 354 SQL files and generates prisma/schema.prisma
"""

from __future__ import annotations

import os
import re
from collections import OrderedDict

DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
PRISMA_OUT = os.path.join(os.path.dirname(__file__), '..', 'prisma', 'schema.prisma')

# ── Type mapping ──────────────────────────────────────────────────────────
PG_2_PRISMA = {
    'uuid': 'String @id @default(uuid())',
    'uuid NOT NULL': 'String',
    'uuid DEFAULT uuid_generate_v4()': 'String @id @default(uuid())',
    'uuid DEFAULT gen_random_uuid()': 'String @id @default(uuid())',
    'bigint': 'BigInt',
    'bigint NOT NULL': 'BigInt',
    'bigserial': 'BigInt @default(autoincrement())',
    'bigserial NOT NULL': 'BigInt @default(autoincrement())',
    'int': 'Int',
    'int NOT NULL': 'Int',
    'int4': 'Int',
    'int4 NOT NULL': 'Int',
    'smallint': 'Int',
    'smallint NOT NULL': 'Int',
    'integer': 'Int',
    'integer NOT NULL': 'Int',
    'serial': 'Int @default(autoincrement())',
    'serial NOT NULL': 'Int @default(autoincrement())',
    'boolean': 'Boolean',
    'boolean NOT NULL': 'Boolean',
    'boolean DEFAULT false': 'Boolean @default(false)',
    'boolean DEFAULT true': 'Boolean @default(true)',
    'timestamptz': 'DateTime',
    'timestamptz NOT NULL': 'DateTime',
    'timestamp': 'DateTime',
    'timestamp NOT NULL': 'DateTime',
    'date': 'DateTime',
    'date NOT NULL': 'DateTime',
    'time': 'DateTime',
    'time NOT NULL': 'DateTime',
    'numeric': 'Decimal',
    'numeric NOT NULL': 'Decimal',
    'real': 'Float',
    'real NOT NULL': 'Float',
    'double precision': 'Float',
    'double precision NOT NULL': 'Float',
    'jsonb': 'Json',
    'jsonb NOT NULL': 'Json',
    'json': 'Json',
    'json NOT NULL': 'Json',
    'text': 'String',
    'text NOT NULL': 'String',
    'character varying': 'String',
    'character varying NOT NULL': 'String',
    'varchar': 'String',
    'varchar NOT NULL': 'String',
    'bytea': 'Bytes',
    'bytea NOT NULL': 'Bytes',
    'oid': 'Int',
    'oid NOT NULL': 'Int',
    'inet': 'String',
    'inet NOT NULL': 'String',
    'macaddr': 'String',
    'macaddr NOT NULL': 'String',
    'uuid[]': 'String[]',
    'uuid[] NOT NULL': 'String[]',
    'text[]': 'String[]',
    'text[] NOT NULL': 'String[]',
    'bigint[]': 'BigInt[]',
    'bigint[] NOT NULL': 'BigInt[]',
    'int[]': 'Int[]',
    'int[] NOT NULL': 'Int[]',
    'smallint[]': 'Int[]',
    'smallint[] NOT NULL': 'Int[]',
    'varchar[]': 'String[]',
    'varchar[] NOT NULL': 'String[]',
    'character varying[]': 'String[]',
    'character varying[] NOT NULL': 'String[]',
    'boolean[]': 'Boolean[]',
    'boolean[] NOT NULL': 'Boolean[]',
    'timestamptz[]': 'DateTime[]',
    'timestamptz[] NOT NULL': 'DateTime[]',
    'numeric[]': 'Decimal[]',
    'numeric[] NOT NULL': 'Decimal[]',
    'integer[]': 'Int[]',
    'integer[] NOT NULL': 'Int[]',
    'timestamp[]': 'DateTime[]',
    'timestamp[] NOT NULL': 'DateTime[]',
    'date[]': 'DateTime[]',
    'date[] NOT NULL': 'DateTime[]',
    'time[]': 'DateTime[]',
    'time[] NOT NULL': 'DateTime[]',
}

PG_2_PRISMA_KEYS = sorted(PG_2_PRISMA.keys(), key=lambda k: (-len(k), k))

# ── SQL parsing ──────────────────────────────────────────────────────────

def snake_to_pascal(name: str) -> str:
    return ''.join(word.capitalize() for word in name.split('_'))

def camel_case(name: str) -> str:
    parts = name.split('_')
    return parts[0] + ''.join(p.capitalize() for p in parts[1:])

def type_mapping_idx(raw_type: str) -> str | None:
    lower = raw_type.lower()
    collapsed = re.sub(r'\([^)]*\)', '', lower).strip()
    if collapsed.startswith('numeric'):
        collapsed = 'numeric'
    for key in PG_2_PRISMA_KEYS:
        key_collapsed = re.sub(r'\([^)]*\)', '', key.lower()).strip()
        if collapsed == key_collapsed:
            return key
    if collapsed.endswith('not null'):
        collapsed_clean = collapsed[:-8].strip()
        for key in PG_2_PRISMA_KEYS:
            key_collapsed = re.sub(r'\([^)]*\)', '', key.lower()).strip()
            if collapsed_clean == key_collapsed:
                return key
    if '[]' not in collapsed:
        for suffix in ('[]',):
            test = collapsed + suffix
            for key in PG_2_PRISMA_KEYS:
                key_collapsed = re.sub(r'\([^)]*\)', '', key.lower()).strip()
                if test == key_collapsed:
                    return key
    return None


def extract_sql_files(base_dir: str) -> list[str]:
    sql_files = []
    for root, _, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.sql'):
                sql_files.append(os.path.join(root, f))
    return sorted(sql_files)


def read_sql(filepath: str) -> str:
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def find_table_refs(sql_content: str) -> list[tuple[str, int]]:
    refs = []
    for m in re.finditer(
        r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)',
        sql_content, re.IGNORECASE
    ):
        refs.append((m.group(1), m.start(), 'table'))
    for m in re.finditer(
        r'CREATE\s+TYPE\s+(?:public\.)?(\w+)\s+AS\s+ENUM\s*\(',
        sql_content, re.IGNORECASE
    ):
        refs.append((m.group(1), m.start(), 'enum'))
    return refs


def extract_table(sql_content: str, table_name: str, start: int) -> str | None:
    paren_start = sql_content.index('(', start)
    depth = 1
    i = paren_start + 1
    while depth > 0 and i < len(sql_content):
        if sql_content[i] == '(':
            depth += 1
        elif sql_content[i] == ')':
            depth -= 1
        i += 1
    end = i
    body = sql_content[paren_start:end]
    return f"CREATE TABLE {table_name} {body}"


def extract_enum(sql_content: str, type_name: str, start: int) -> str | None:
    m = re.search(r'AS\s+ENUM\s*\(', sql_content[start:], re.IGNORECASE)
    if not m:
        return None
    paren_start = start + m.end() - 1
    depth = 1
    i = paren_start + 1
    while depth > 0 and i < len(sql_content):
        if sql_content[i] == '(':
            depth += 1
        elif sql_content[i] == ')':
            depth -= 1
        i += 1
    end = i
    body = sql_content[paren_start:end]
    return f"CREATE TYPE {type_name} AS ENUM {body}"


def parse_enum_values(enum_stmt: str) -> list[str]:
    m = re.search(r'\((.*)\)', enum_stmt, re.DOTALL)
    if not m:
        return []
    inner = m.group(1)
    values = []
    for v in inner.split(','):
        v = v.strip().strip("'")
        if v:
            values.append(v)
    return values


def extract_columns(create_stmt: str) -> list[dict]:
    paren_idx = create_stmt.index('(')
    depth = 1
    i = paren_idx + 1
    while depth > 0 and i < len(create_stmt):
        if create_stmt[i] == '(':
            depth += 1
        elif create_stmt[i] == ')':
            depth -= 1
        i += 1
    body = create_stmt[paren_idx+1:i-1]

    # Strip SQL comments (both full-line and inline) before splitting by comma
    # This prevents inline comments like `-- DAILY, WEEKLY, REALTIME` from creating phantom columns
    body = re.sub(r'--.*?$', '', body, flags=re.MULTILINE)
    # Also strip full-line comments
    body_lines = body.split('\n')
    cleaned_lines = [
        l for l in body_lines
        if l.strip()
    ]
    body = '\n'.join(cleaned_lines)

    columns = []
    depth = 0
    current = ''
    for ch in body:
        if ch == '(':
            depth += 1
            current += ch
        elif ch == ')':
            depth -= 1
            current += ch
        elif ch == ',' and depth == 0:
            col = current.strip()
            if col:
                columns.append(col)
            current = ''
        else:
            current += ch
    if current.strip():
        columns.append(current.strip())

    result = []
    table_pk_cols = []  # Columns from table-level PRIMARY KEY (col1, col2)
    for col in columns:
        # Skip any remaining comment-like artifacts
        if col.startswith('--') or col.startswith('//') or col.startswith('#'):
            continue
        # Handle table-level PRIMARY KEY (col1, col2, ...) and CONSTRAINT pk_name PRIMARY KEY (...)
        # Only match when the line starts with PRIMARY KEY or CONSTRAINT ... PRIMARY KEY (not column-level PK)
        is_table_level_pk = (
            col.upper().startswith('PRIMARY KEY') or
            (col.upper().startswith('CONSTRAINT') and 'PRIMARY KEY' in col.upper())
        )
        if is_table_level_pk:
            pk_match = re.search(r'PRIMARY\s+KEY\s*\(([^)]+)\)', col, re.IGNORECASE)
            if pk_match:
                table_pk_cols = [c.strip() for c in pk_match.group(1).split(',')]
            continue
        # Skip other constraints
        if col.upper().startswith(('CONSTRAINT', 'UNIQUE', 'INDEX', 'FOREIGN KEY', 'CHECK', 'EXCLUDE')):
            continue
        # Split by whitespace respecting parenthesized groups (e.g., NUMERIC(20, 10))
        col_parts = []
        current_part = ''
        paren_depth = 0
        for ch in col:
            if ch == '(':
                paren_depth += 1
                current_part += ch
            elif ch == ')':
                paren_depth -= 1
                current_part += ch
            elif ch in (' ', '\t') and paren_depth == 0:
                if current_part:
                    col_parts.append(current_part)
                    current_part = ''
            else:
                current_part += ch
        if current_part:
            col_parts.append(current_part)
        if len(col_parts) < 2:
            continue
        col_name = col_parts[0]
        raw_type = col_parts[1]
        rest = ' '.join(col_parts[2:]) if len(col_parts) > 2 else ''

        is_not_null = 'NOT NULL' in rest.upper()
        is_pk = 'PRIMARY KEY' in rest.upper()
        is_unique = 'UNIQUE' in rest.upper()

        default_m = re.search(r'DEFAULT\s+(.+?)(?:\s+NOT\s+NULL|\s+PRIMARY\s+KEY|\s+UNIQUE|\s+REFERENCES|$)', rest, re.IGNORECASE)
        default_val = default_m.group(1).strip() if default_m else None

        fk_m = re.search(r'REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)', rest, re.IGNORECASE)
        fk_ref_table = fk_m.group(1) if fk_m else None
        fk_ref_col = fk_m.group(2) if fk_m else None

        col_info = {
            'name': col_name,
            'raw_type': raw_type,
            'not_null': is_not_null,
            'pk': is_pk,
            'unique': is_unique,
            'default': default_val,
            'fk_ref_table': fk_ref_table,
            'fk_ref_col': fk_ref_col,
        }
        result.append(col_info)

    # Mark PK columns from table-level PRIMARY KEY (col1, col2)
    if table_pk_cols:
        for col_info in result:
            if col_info['name'] in table_pk_cols:
                col_info['pk'] = True
                # Remove @id from non-first composite PK columns
                if len(table_pk_cols) > 1 and table_pk_cols.index(col_info['name']) > 0:
                    col_info['pk'] = True  # Still PK, but @@id handles the composite

    return result


def find_foreign_keys(sql_content: str, table_name: str) -> list[dict]:
    fks = []
    for m in re.finditer(
        r'FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)',
        sql_content, re.IGNORECASE
    ):
        fks.append({
            'col': m.group(1),
            'ref_table': m.group(2),
            'ref_col': m.group(3),
            'source': 'constraint',
        })
    return fks


def find_unique_constraints(sql_content: str, table_name: str) -> list[list[str]]:
    constraints = []
    for m in re.finditer(
        r'(?:CONSTRAINT\s+\w+\s+)?UNIQUE\s*\(([^)]+)\)',
        sql_content, re.IGNORECASE
    ):
        cols = [c.strip() for c in m.group(1).split(',')]
        constraints.append(cols)
    return constraints


def find_indexes(sql_content: str, table_name: str) -> list[dict]:
    indexes = []
    pattern = rf'CREATE\s+(UNIQUE\s+)?INDEX\s+(?:\w+\s+)?ON\s+(?:public\.)?{re.escape(table_name)}\s*\(([^)]+)\)'
    for m in re.finditer(pattern, sql_content, re.IGNORECASE):
        is_unique = m.group(1) is not None
        cols = [c.strip() for c in m.group(2).split(',')]
        indexes.append({
            'unique': is_unique,
            'cols': cols,
        })
    return indexes


# ── Prisma writer ────────────────────────────────────────────────────────

class RelationNameManager:
    def __init__(self):
        self._names: set[str] = set()
        self._cache: dict[tuple[str, str, str], str] = {}

    def get_relation_name(self, fk_col: str, ref_table: str, source_table: str = '') -> str:
        key = (source_table, fk_col, ref_table)
        if key in self._cache:
            return self._cache[key]
        base = f"{fk_col}_to_{ref_table}"
        if source_table:
            base = f"{source_table}_{base}"
        name = base
        suffix = 2
        while name in self._names:
            name = f"{base}_{suffix}"
            suffix += 1
        self._names.add(name)
        self._cache[key] = name
        return name


def col_name_to_field(col_name: str) -> str:
    return camel_case(col_name)


# --- 15-database-conventions.md mappings ---
# Domain types + PG types mapped to Prisma types
DOMAIN_SQL_2_PRISMA = {
    'uuid': 'String',
    'bigint': 'BigInt',
    'bigserial': 'BigInt @default(autoincrement())',
    'int': 'Int',
    'int4': 'Int',
    'integer': 'Int',
    'smallint': 'Int',
    'serial': 'Int @default(autoincrement())',
    'boolean': 'Boolean',
    'timestamptz': 'DateTime',
    'timestamp': 'DateTime',
    'date': 'DateTime',
    'time': 'DateTime',
    'numeric': 'Decimal',
    'real': 'Float',
    'double precision': 'Float',
    'jsonb': 'Json',
    'json': 'Json',
    'text': 'String',
    'character varying': 'String',
    'varchar': 'String',
    'bytea': 'Bytes',
    'oid': 'Int',
    'inet': 'String',
    'macaddr': 'String',
    'char': 'String',
    'tsvector': 'String',
    'ltree': 'String',
    'citext': 'String',
    # Custom PG domain types → String
    'email_address': 'String',
    'phone_number': 'String',
    'currency_code': 'String',
    'color_hex': 'String',
    'percentage': 'Decimal',
    'positive_amount': 'Decimal',
    'latitude': 'Decimal',
    'longitude': 'Decimal',
}

# PG types that map to 'String' (non-enumerable)
STRING_TYPES = {'uuid', 'text', 'character varying', 'varchar', 'bytea', 'inet', 'macaddr', 'char'}

# Types that are definitely NOT enums
NON_ENUM_TYPES = {'serial', 'bigserial', 'smallserial', 'bigint', 'int', 'int4', 'integer', 'smallint', 'boolean', 'timestamptz', 'timestamp', 'date', 'time', 'numeric', 'real', 'double precision', 'jsonb', 'json', 'text', 'bytea', 'oid', 'inet', 'macaddr', 'character varying', 'varchar', 'char'}


def map_column_type(col_info: dict) -> str:
    raw = col_info['raw_type'].lower()
    raw_base = re.sub(r'\([^)]*\)', '', raw).strip()

    if raw_base in DOMAIN_SQL_2_PRISMA:
        prisma_type = DOMAIN_SQL_2_PRISMA[raw_base]
    elif not raw_base.endswith('[]') and raw_base not in NON_ENUM_TYPES:
        prisma_type = snake_to_pascal(raw_base)
    else:
        prisma_type = PG_2_PRISMA.get(raw, 'String')

    return prisma_type


def write_prisma_enum(f, enum_name: str, values: list[str]):
    f.write(f"\nenum {enum_name} {{\n")
    for v in values:
        f.write(f"  {v}\n")
    f.write("}\n")


def find_model_pk_columns(all_tables: dict[str, str], model_name: str) -> list[str]:
    """Find PK column names for a given model/table."""
    table_name = None
    # Try snake_case table name
    snake = '_'.join(re.findall(r'[A-Z][a-z]*', model_name)).lower()
    if snake in all_tables:
        table_name = snake
    else:
        # Try direct lookup
        for tn in all_tables:
            if snake_to_pascal(tn) == model_name:
                table_name = tn
                break
    if not table_name:
        return ['id']  # fallback

    cols = extract_columns(all_tables[table_name])
    pk_cols = [c for c in cols if c['pk']]
    if pk_cols:
        return [col_name_to_field(c['name']) for c in pk_cols]
    return ['id']  # fallback


def write_prisma_model(f, table_name: str, columns: list[dict],
                        foreign_keys: list[dict],
                        uniques: list[list[str]],
                        indexes: list[dict],
                        enum_types: dict[str, list[str]],
                        rel_name_mgr: RelationNameManager,
                        inbound_refs: list[dict],
                        table_enum_cols: set[str],
                        all_tables: dict[str, str]):
    model_name = snake_to_pascal(table_name)

    pk_cols = [c for c in columns if c['pk']]
    is_composite_pk = len(pk_cols) > 1
    model_scalar_fields = set()
    model_relation_fields = set()

    f.write(f"\nmodel {model_name} {{\n")

    # 1. Columns
    for col in columns:
        col_field = col_name_to_field(col['name'])
        prisma_type = map_column_type(col)

        model_scalar_fields.add(col_field)

        if col['pk'] and not is_composite_pk:
            if col['raw_type'].lower().startswith('uuid'):
                prisma_type = 'String @id @default(uuid())'
            elif col['raw_type'].lower() in ('bigserial', 'serial'):
                prisma_type = prisma_type
            else:
                prisma_type = prisma_type.split(' ')[0] + ' @id'

        if col['unique'] and not col['pk']:
            prisma_type += ' @unique'

        if col['default'] and not col['pk']:
            default_val = col['default']
            prisma_default = map_default_value(default_val, prisma_type, col['raw_type'])
            if prisma_default:
                prisma_type += f' {prisma_default}'

        # Check if the type is an enum (PascalCase, not in DOMAIN_SQL_2_PRISMA)
        raw_base = re.sub(r'\([^)]*\)', '', col['raw_type'].lower()).strip()
        if raw_base not in DOMAIN_SQL_2_PRISMA and raw_base not in STRING_TYPES and not raw_base.endswith('[]') and raw_base not in NON_ENUM_TYPES:
            enum_name = snake_to_pascal(raw_base)
            prisma_type = enum_name
            table_enum_cols.add(col_field)
            model_relation_fields.add(col_field)

        f.write(f"  {col_field}  {prisma_type}\n")

    # 2. @@id for composite PK
    if len(pk_cols) > 1:
        pk_fields = ', '.join(col_name_to_field(c['name']) for c in pk_cols)
        f.write(f"  @@id([{pk_fields}])\n")

    # 3. @@unique constraints
    for uq in uniques:
        uq_fields = []
        skip = False
        for col_name in uq:
            if col_name not in [c['name'] for c in columns]:
                skip = True
                break
            field_name = col_name_to_field(col_name)
            # Skip if field is a relation/enum field (not a scalar)
            if field_name in model_relation_fields:
                skip = True
                break
            uq_fields.append(field_name)
        if not skip and uq_fields:
            f.write(f"  @@unique([{', '.join(uq_fields)}])\n")

    # 4. Indexes
    for idx in indexes:
        idx_fields = []
        skip = False
        for col_name in idx['cols']:
            col_name_clean = col_name.strip().split(' ')[0]
            if col_name_clean not in [c['name'] for c in columns]:
                skip = True
                break
            field_name = col_name_to_field(col_name_clean)
            if field_name in model_relation_fields:
                skip = True
                break
            idx_fields.append(field_name)
        if not skip:
            if idx['unique']:
                f.write(f"  @@unique([{', '.join(idx_fields)}])\n")
            else:
                f.write(f"  @@index([{', '.join(idx_fields)}])\n")

    # 5. Inbound relations
    seen_inbound_names: set[str] = set()
    for ref in inbound_refs:
        ref_table = ref['table']
        ref_col = ref['col']
        ref_model = snake_to_pascal(ref_table)

        # Use same relation name as the FK side will generate
        if ref_col == 'tenant_id':
            rel_name = f"{ref_col}_to_{table_name}"
        else:
            rel_name = rel_name_mgr.get_relation_name(ref_col, table_name, ref['table'])
        base_name = ref_table + 's'
        rel_field_name = base_name
        if rel_field_name in model_scalar_fields or rel_field_name in seen_inbound_names:
            rel_field_name = f"{ref_table}_{ref_col}"
        if rel_field_name in model_scalar_fields or rel_field_name in seen_inbound_names:
            rel_field_name = f"{ref_table}_{ref_col}_list"
        seen_inbound_names.add(rel_field_name)
        model_relation_fields.add(rel_field_name)
        f.write(f"  {rel_field_name}  {ref_model}[]  @relation(\"{rel_name}\")\n")

    # 6. FK relation fields
    for col in columns:
        if col['fk_ref_table']:
            fk_field = col_name_to_field(col['name'])
            ref_model = snake_to_pascal(col['fk_ref_table'])

            # Find actual PK of referenced table
            ref_pk_fields = find_model_pk_columns(all_tables, ref_model)

            is_tenant_fk = col['name'] == 'tenant_id'

            if is_tenant_fk:
                rel_name = f"{col['name']}_to_{col['fk_ref_table']}"
                f.write(f"  tenant  {ref_model}  @relation(\"{rel_name}\", fields: [{fk_field}], references: [{', '.join(ref_pk_fields)}], onDelete: Restrict)\n")
            else:
                rel_name = rel_name_mgr.get_relation_name(col['name'], col['fk_ref_table'], table_name)
                rel_field_name = fk_field
                if rel_field_name in model_scalar_fields:
                    ref_suffix = col['fk_ref_table'][0].lower() + col['fk_ref_table'][1:]
                    if len(rel_field_name + ref_suffix) <= 30:
                        rel_field_name = f"{rel_field_name}{ref_suffix}"
                    else:
                        rel_field_name = f"{rel_field_name[:15]}{ref_suffix[:15]}"

                f.write(f"  {rel_field_name}  {ref_model}?  @relation(\"{rel_name}\", fields: [{fk_field}], references: [{', '.join(ref_pk_fields)}], onDelete: SetNull)\n")

    f.write("}\n")


def map_default_value(sql_default: str, prisma_type: str, raw_sql_type: str) -> str | None:
    val = sql_default.strip()

    if val.lower() in ('now()', 'current_timestamp', 'current_date'):
        return '@default(now())'
    if val.lower() in ('true',):
        return '@default(true)'
    if val.lower() in ('false',):
        return '@default(false)'
    if val.lower() in ('gen_random_uuid()', 'uuid_generate_v4()'):
        return None

    # Numeric defaults
    if prisma_type in ('Int', 'BigInt', 'Float', 'Decimal'):
        try:
            clean = val.split('::')[0].strip()
            num_str = clean.replace('(', '').replace(')', '')
            float(num_str)
            return f'@default({clean})'
        except ValueError:
            return None

    # String defaults: always quote the value
    if prisma_type.startswith('String') or raw_sql_type in STRING_TYPES or raw_sql_type in ('email_address', 'phone_number', 'currency_code', 'color_hex'):
        clean = val.split('::')[0].strip()
        if clean.startswith("'") and clean.endswith("'"):
            inner = clean[1:-1]
            return f'@default("{inner}")'
        if clean.startswith('"') and clean.endswith('"'):
            inner = clean[1:-1]
            return f'@default("{inner}")'
        return f'@default("{clean}")'

    # Enum defaults: use bare value
    clean = val.split('::')[0].strip()
    if clean.startswith("'") and clean.endswith("'"):
        inner = clean[1:-1]
        if inner.isupper() or (inner and inner[0].isupper()):
            return f'@default({inner})'
        return f'@default("{inner}")'
    if clean[0].isupper():
        return f'@default({clean})'
    return None


# ── Main generator ───────────────────────────────────────────────────────

def generate():
    print("Scanning SQL files...")
    sql_files = extract_sql_files(DB_DIR)
    print(f"Found {len(sql_files)} SQL files")

    all_enums: dict[str, list[str]] = OrderedDict()
    all_tables: dict[str, str] = OrderedDict()
    all_foreign_keys: dict[str, list[dict]] = {}
    all_unique_constraints: dict[str, list[list[str]]] = {}
    all_indexes: dict[str, list[dict]] = {}

    module_sql: dict[str, str] = {}

    for filepath in sql_files:
        rel = os.path.relpath(filepath, DB_DIR)
        parts = rel.replace('\\', '/').split('/')
        module = parts[0] if len(parts) > 1 else 'root'

        content = read_sql(filepath)

        if module not in module_sql:
            module_sql[module] = ''
        module_sql[module] += '\n' + content

        for m in re.finditer(
            r'CREATE\s+TYPE\s+(?:public\.)?(\w+)\s+AS\s+ENUM\s*\(',
            content, re.IGNORECASE
        ):
            enum_name = m.group(1)
            enum_stmt = extract_enum(content, enum_name, m.start())
            if enum_stmt:
                values = parse_enum_values(enum_stmt)
                if enum_name in all_enums:
                    existing = all_enums[enum_name]
                    if len(values) > len(existing):
                        all_enums[enum_name] = values
                else:
                    all_enums[enum_name] = values

        for m in re.finditer(
            r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)',
            content, re.IGNORECASE
        ):
            table_name = m.group(1)
            # Skip matches inside SQL comments
            line_start = content.rfind('\n', 0, m.start()) + 1
            line_content = content[line_start:m.start()]
            if line_content.lstrip().startswith('--'):
                continue
            stmt = extract_table(content, table_name, m.start())
            if stmt:
                if table_name not in all_tables:
                    all_tables[table_name] = stmt
                else:
                    all_tables[table_name] = stmt

    # Phase 2: FK constraints from all sources
    def add_fk(table_name: str, fk_col: str, ref_table: str, ref_col: str):
        if table_name not in all_foreign_keys:
            all_foreign_keys[table_name] = []
        exists = any(
            fk['col'] == fk_col and fk['ref_table'] == ref_table
            for fk in all_foreign_keys[table_name]
        )
        if not exists:
            all_foreign_keys[table_name].append({
                'col': fk_col,
                'ref_table': ref_table,
                'ref_col': ref_col,
            })

    # 2a. CONSTRAINT ... FOREIGN KEY inside CREATE TABLE
    for table_name, stmt in all_tables.items():
        for m in re.finditer(
            r'FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)',
            stmt, re.IGNORECASE
        ):
            add_fk(table_name, m.group(1), m.group(2), m.group(3))

    # 2b. ALTER TABLE ... ADD FOREIGN KEY
    for module, sql in module_sql.items():
        for m in re.finditer(
            r'ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)',
            sql, re.IGNORECASE
        ):
            add_fk(m.group(1), m.group(2), m.group(3), m.group(4))

    # 2c. Inline REFERENCES in column definition
    for table_name, stmt in all_tables.items():
        cols = extract_columns(stmt)
        for c in cols:
            if c['fk_ref_table']:
                add_fk(table_name, c['name'], c['fk_ref_table'], c['fk_ref_col'])

    # Phase 4: UNIQUE constraints and indexes
    for module, sql in module_sql.items():
        for table_name in all_tables:
            pattern = rf'(?:ALTER\s+TABLE\s+(?:public\.)?{re.escape(table_name)}\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?)?UNIQUE\s*\(([^)]+)\)'
            for m in re.finditer(pattern, sql, re.IGNORECASE):
                before = sql[max(0, m.start()-200):m.start()]
                if table_name in before or m.group(0).startswith('UNIQUE'):
                    cols = [c.strip() for c in m.group(1).split(',')]
                    if table_name not in all_unique_constraints:
                        all_unique_constraints[table_name] = []
                    if cols not in all_unique_constraints[table_name]:
                        all_unique_constraints[table_name].append(cols)

            idx_pattern = rf'CREATE\s+(UNIQUE\s+)?INDEX\s+(?:\w+\s+)?ON\s+(?:public\.)?{re.escape(table_name)}\s*\(([^)]+)\)'
            for m in re.finditer(idx_pattern, sql, re.IGNORECASE):
                is_unique = m.group(1) is not None
                cols = [c.strip() for c in m.group(2).split(',')]
                if table_name not in all_indexes:
                    all_indexes[table_name] = []
                all_indexes[table_name].append({
                    'unique': is_unique,
                    'cols': cols,
                })

    # Phase 5: Inbound refs
    inbound_refs: dict[str, list[dict]] = {}
    for table_name, fks in all_foreign_keys.items():
        for fk in fks:
            ref_table = fk['ref_table']
            if ref_table not in inbound_refs:
                inbound_refs[ref_table] = []
            inbound_refs[ref_table].append({
                'table': table_name,
                'col': fk['col'],
            })

    # Phase 6: Write Prisma schema
    rel_name_mgr = RelationNameManager()
    table_enum_cols: set[str] = set()

    lines = []
    lines.append("// ── Auto-generated Prisma Schema ──────────────────────────────")
    lines.append("// Generated from SQL files in database/")
    lines.append(f"// Source: {len(sql_files)} SQL files across {len(module_sql)} modules")
    lines.append("//")
    lines.append("generator client {")
    lines.append("  provider = \"prisma-client-js\"")
    lines.append("}")
    lines.append("")
    lines.append("datasource db {")
    lines.append("  provider = \"postgresql\"")
    lines.append("  url      = env(\"DATABASE_URL\")")
    lines.append("}")

    with open(PRISMA_OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

        f.write("\n\n// ── Enums ────────────────────────────────────────────────")
        for enum_name in sorted(all_enums.keys()):
            values = all_enums[enum_name]
            write_prisma_enum(f, snake_to_pascal(enum_name), values)

        f.write("\n\n// ── Models ───────────────────────────────────────────────")
        for table_name in all_tables:
            cols = extract_columns(all_tables[table_name])
            fks = all_foreign_keys.get(table_name, [])
            uniques = all_unique_constraints.get(table_name, [])
            indexes = all_indexes.get(table_name, [])
            refs = inbound_refs.get(table_name, [])

            col_map = {c['name']: c for c in cols}
            for fk in fks:
                if fk['col'] in col_map:
                    col_map[fk['col']]['fk_ref_table'] = fk['ref_table']
                    col_map[fk['col']]['fk_ref_col'] = fk['ref_col']

            write_prisma_model(
                f, table_name, cols, fks, uniques, indexes,
                all_enums, rel_name_mgr, refs, table_enum_cols, all_tables
            )

    print(f"\nSchema written to {PRISMA_OUT}")
    print(f"  Enums: {len(all_enums)}")
    print(f"  Models: {len(all_tables)}")
    print(f"  Foreign keys: {sum(len(v) for v in all_foreign_keys.values())}")
    print(f"  Inbound refs: {sum(len(v) for v in inbound_refs.values())}")
    print(f"  Unique constraints: {sum(len(v) for v in all_unique_constraints.values())}")
    print(f"  Indexes: {sum(len(v) for v in all_indexes.values())}")


if __name__ == '__main__':
    generate()
