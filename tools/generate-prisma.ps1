<# 
.SYNOPSIS
Extracts all CREATE TABLE / CREATE TYPE DDL from SQL files and generates schema.prisma
#>

$ErrorActionPreference = "Stop"
$OutputFile = "D:\FreeLance\NEET_platform\prisma\schema.prisma"
$DatabaseDir = "D:\FreeLance\NEET_platform\database"
New-Item -ItemType File -Path $OutputFile -Force | Out-Null
$sb = [System.Text.StringBuilder]::new()

# === HEADER ===
$sb.AppendLine("// ============================================================") | Out-Null
$sb.AppendLine("// Education Management Platform — Prisma Schema") | Out-Null
$sb.AppendLine("// Auto-generated from SQL DDL. Do not edit manually.") | Out-Null
$sb.AppendLine("// Regenerate: pwsh tools\generate-prisma.ps1") | Out-Null
$sb.AppendLine("// ============================================================") | Out-Null
$sb.AppendLine("") | Out-Null
$sb.AppendLine("generator client {") | Out-Null
$sb.AppendLine("  provider = ""prisma-client-js""") | Out-Null
$sb.AppendLine("}") | Out-Null
$sb.AppendLine("") | Out-Null
$sb.AppendLine("datasource db {") | Out-Null
$sb.AppendLine("  provider = ""postgresql""") | Out-Null
$sb.AppendLine("  url      = env(""DATABASE_URL"")") | Out-Null
$sb.AppendLine("}") | Out-Null
$sb.AppendLine("") | Out-Null

# === STEP 1: Extract all Enums from 00.02_types.sql ===
Write-Host "Step 1: Extracting enums..." -ForegroundColor Cyan
$typesContent = Get-Content "$DatabaseDir\00-governance\00.02_types.sql" -Raw

# Pattern: CREATE TYPE name AS ENUM ('VAL1', 'VAL2', ...)
$pattern = "CREATE TYPE\s+(\w+)\s+AS\s+ENUM\s*\(([^)]+)\)"
$enumMatches = [regex]::Matches($typesContent, $pattern)

$processedEnums = @{}
foreach ($match in $enumMatches) {
    $enumName = $match.Groups[1].Value
    $valuesRaw = $match.Groups[2].Value
    
    # Skip if already processed
    if ($processedEnums.ContainsKey($enumName)) { continue }
    $processedEnums[$enumName] = $true
    
    # Parse values
    $values = @()
    $valPattern = "'([^']+)'"
    $valMatches = [regex]::Matches($valuesRaw, $valPattern)
    foreach ($vm in $valMatches) {
        $values += $vm.Groups[1].Value
    }
    
    # Convert to PascalCase (remove _enum suffix)
    $modelName = $enumName
    if ($modelName -match '^(.+)_enum$') {
        $modelName = $matches[1]
    }
    # Convert snake_case to PascalCase
    $modelName = ($modelName -split '_' | ForEach-Object { "$(Get-Culture).TextInfo.ToTitleCase($_.ToLower())" }) -join ''
    
    $sb.AppendLine("enum $modelName {") | Out-Null
    foreach ($val in $values) {
        $sb.AppendLine("  $val") | Out-Null
    }
    $sb.AppendLine("  @@map(""$enumName"")") | Out-Null
    $sb.AppendLine("}") | Out-Null
    $sb.AppendLine("") | Out-Null
}

Write-Host "  Found $($processedEnums.Count) enums" -ForegroundColor Green

# === STEP 2: Extract all CREATE TABLE statements ===
Write-Host "Step 2: Extracting table definitions..." -ForegroundColor Cyan

# Map of table_name -> { columns, constraints, indexes, model_name }
$tables = @{}
$tableOrder = @()  # Preserve order

# Process SQL files in order
$sqlFiles = Get-ChildItem -Path $DatabaseDir -Recurse -Filter "*.sql" | 
    Where-Object { $_.Directory.Name -eq "" -or $_.Name -match '^\d+' } |
    Sort-Object FullName

# Module order (respect dependency order)
$moduleOrder = @(
    "00-governance",
    "01-master",
    "02-auth", 
    "04-people",
    "05-attendance",
    "06-examinations",
    "07-question-bank",
    "08-learning",
    "09-live-classes",
    "10-fees",
    "11-communication",
    "12-analytics",
    "13-ai",
    "14-platform",
    "15-authorization",
    "16-workflow",
    "17-governance",
    "18-shared"
)

# Read all table SQL files in module order
foreach ($module in $moduleOrder) {
    $moduleDir = "$DatabaseDir\$module\tables"
    if (-not (Test-Path $moduleDir)) {
        # Try root level files in module
        $moduleDir = "$DatabaseDir\$module"
        $tableFiles = Get-ChildItem -Path $moduleDir -Filter "*.sql" | 
            Where-Object { $_.Name -match '^\d+\.\d+' -or $_.Name -match '^\d{3}_' } |
            Sort-Object Name
    } else {
        $tableFiles = Get-ChildItem -Path $moduleDir -Filter "*.sql" | Sort-Object Name
    }
    
    foreach ($file in $tableFiles) {
        $content = Get-Content $file.FullName -Raw
        
        # Find CREATE TABLE IF NOT EXISTS public.table_name
        $tablePattern = "CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.(\w+)\s*\(([\s\S]+?)\)\s*(?:WITH|TABLESPACE|PARTITION|;|--|\/\*)"
        $tableMatch = [regex]::Match($content, $tablePattern)
        
        if (-not $tableMatch.Success) {
            # Try without IF NOT EXISTS
            $tablePattern2 = "CREATE\s+TABLE\s+public\.(\w+)\s*\(([\s\S]+?)\)\s*(?:WITH|TABLESPACE|PARTITION|;|--|\/\*)"
            $tableMatch = [regex]::Match($content, $tablePattern2)
        }
        
        if ($tableMatch.Success) {
            $tableName = $tableMatch.Groups[1].Value
            $tableBody = $tableMatch.Groups[2].Value
            
            # Extract columns (everything before constraints section)
            $columns = @()
            $constraints = @()
            $fks = @()
            $uniqueCols = @()
            $indexes = @()
            
            # Split body into lines and process
            $lines = $tableBody -split '\n'
            $currentLine = ""
            $inColumnDef = $true
            $parenLevel = 0
            
            # Extract column definitions (lines that have column_name type, not CONSTRAINT or PRIMARY KEY or UNIQUE)
            $colPattern = '^\s+(\w+)\s+([A-Z_]+(?:\([^)]*\))?(?:\s*\[\])?)(.*?)(?:,?\s*)$'
            
            # Better approach: process the body line by line, tracking parentheses
            $fullBody = $tableBody -replace '--[^\n]*', ''  # Remove comments
            $fullBody = $fullBody -replace '[\r\n]+', ' '   # Flatten
            
            # Extract columns with their types and defaults
            # Pattern: column_name TYPE [(size)] [NOT NULL] [DEFAULT value] [REFERENCES...]
            $colExtract = [regex]::Matches($fullBody, '(\w+)\s+(CITEXT|UUID|VARCHAR\((\d+)\)|TEXT|INTEGER|BIGINT|SMALLINT|BOOLEAN|DECIMAL\((\d+),(\d+)\)|NUMERIC\((\d+),(\d+)\)|TIMESTAMP\s*(?:WITH\s+TIME\s+ZONE)?|DATE|TIME|JSONB|BYTEA|REAL|DOUBLE\s+PRECISION|INET|SERIAL|BIGSERIAL|''(?:[^'']+)''|(?:[A-Z_]+(?:\([^)]*\))?))(?:\s+NOT\s+NULL|\s+NULL)?(?:\s+DEFAULT\s+(?:gen_random_uuid\(\)|generate_primary_key\(\)|now\(\)|CURRENT_DATE|true|false|[^,)]+))?(?:\s+PRIMARY\s+KEY)?(?:\s+REFERENCES\s+[^,)]+)?(?:\s+UNIQUE)?')
            
            foreach ($colMatch in $colExtract) {
                $colName = $colMatch.Groups[1].Value
                $colType = $colMatch.Groups[2].Value
                
                # Skip if it's a CONSTRAINT, PRIMARY KEY, UNIQUE, CHECK, or INDEX keyword
                if ($colName -match '^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|INDEX|FOREIGN|EXCLUDE)$') { continue }
                if ($colName -eq 'KEY' -or $colName -eq 'REFERENCES') { continue }
                
                # Determine exact start position of this column for extracting modifiers
                $colStart = $colMatch.Index
                $beforeCol = $fullBody.Substring(0, $colStart)
                
                # Extract full column definition from after previous comma/start paren to next comma
                $segStart = $beforeCol.LastIndexOfAny(@(',', '('))
                if ($segStart -ge 0) {
                    $colDefStart = $segStart + 1
                } else {
                    $colDefStart = 0
                }
                
                $nextComma = $fullBody.IndexOf(',', $colStart + $colMatch.Length)
                $nextParen = $fullBody.IndexOf(')', $colStart + $colMatch.Length)
                $nextConstraint = $fullBody.IndexOf('CONSTRAINT', $colStart + $colMatch.Length)
                
                $endPos = $nextComma
                if ($endPos -eq -1 -or ($nextParen -gt 0 -and $nextParen -lt $endPos)) { $endPos = $nextParen }
                if ($nextConstraint -gt 0 -and $nextConstraint -lt $endPos) { $endPos = $nextConstraint - 1 }
                if ($endPos -eq -1) { $endPos = $colStart + $colMatch.Length }
                
                if ($endPos -le $colStart) { $endPos = $colStart + $colMatch.Length }
                
                $colDef = $fullBody.Substring($colStart, $endPos - $colStart).Trim()
                
                # Determine nullability
                $notNull = $colDef -match '\bNOT\s+NULL\b' -or $colName -eq 'id'
                $hasDefault = $colDef -match '\bDEFAULT\s+'
                
                $columns += @{
                    name = $colName
                    type = $colType
                    notNull = $notNull
                    hasDefault = $hasDefault
                    rawDef = $colDef
                }
            }
            
            if ($columns.Count -gt 0) {
                $modelName = ($tableName -split '_' | ForEach-Object { "$(Get-Culture).TextInfo.ToTitleCase($_.ToLower())" }) -join ''
                
                $tables[$tableName] = @{
                    modelName = $modelName
                    columns = $columns
                }
                $tableOrder += $tableName
                Write-Host "  Found table: $tableName → $modelName ($($columns.Count) columns)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host "  Found $($tables.Count) tables" -ForegroundColor Green

# === Write Tables to schema.prisma ===
Write-Host "Step 3: Writing schema.prisma..." -ForegroundColor Cyan

foreach ($tableName in $tableOrder) {
    $info = $tables[$tableName]
    $modelName = $info.modelName
    
    $sb.AppendLine("model $modelName {") | Out-Null
    
    foreach ($col in $info.columns) {
        $prismaType = "String"
        $colType = $col.type.ToUpper().Trim()
        
        # Map PostgreSQL type to Prisma type
        if ($colType -eq 'UUID') { $prismaType = "String @db.Uuid" }
        elseif ($colType -match '^VARCHAR\((\d+)\)$') { $prismaType = "String @db.VarChar($($matches[1]))" }
        elseif ($colType -eq 'TEXT') { $prismaType = "String @db.Text" }
        elseif ($colType -eq 'CITEXT') { $prismaType = "String @db.VarChar(255)" }
        elseif ($colType -match '^DECIMAL\((\d+),(\d+)\)$') { $prismaType = "Decimal @db.Decimal($($matches[1]), $($matches[2]))" }
        elseif ($colType -match '^NUMERIC\((\d+),(\d+)\)$') { $prismaType = "Decimal @db.Decimal($($matches[1]), $($matches[2]))" }
        elseif ($colType -eq 'INTEGER') { $prismaType = "Int" }
        elseif ($colType -eq 'BIGINT') { $prismaType = "BigInt" }
        elseif ($colType -eq 'SMALLINT') { $prismaType = "Int" }
        elseif ($colType -eq 'BOOLEAN') { $prismaType = "Boolean" }
        elseif ($colType -eq 'DATE') { $prismaType = "DateTime @db.Date" }
        elseif ($colType -match 'TIMESTAMP') { $prismaType = "DateTime @db.Timestamptz(6)" }
        elseif ($colType -eq 'TIME') { $prismaType = "DateTime @db.Time" }
        elseif ($colType -eq 'JSONB') { $prismaType = "Json @db.JsonB" }
        elseif ($colType -eq 'BYTEA') { $prismaType = "Bytes" }
        elseif ($colType -eq 'REAL' -or $colType -eq 'DOUBLE PRECISION') { $prismaType = "Float" }
        elseif ($colType -eq 'INET') { $prismaType = "String @db.VarChar(45)" }
        elseif ($colType -eq 'SERIAL') { $prismaType = "Int @default(autoincrement())" }
        elseif ($colType -eq 'BIGSERIAL') { $prismaType = "BigInt @default(autoincrement())" }
        else {
            # Could be an enum or domain type
            if ($processedEnums.ContainsKey($colType.ToLower())) {
                $prismaType = $colType
            } elseif ($colType -eq 'EMAIL_ADDRESS') { $prismaType = "String @db.VarChar(255)" }
            elseif ($colType -eq 'PHONE_NUMBER') { $prismaType = "String @db.VarChar(20)" }
            elseif ($colType -eq 'CURRENCY_CODE') { $prismaType = "String @db.VarChar(3)" }
            elseif ($colType -eq 'PERCENTAGE') { $prismaType = "Decimal @db.Decimal(5, 2)" }
            elseif ($colType -eq 'POSITIVE_AMOUNT') { $prismaType = "Decimal @db.Decimal(12, 2)" }
            elseif ($colType -eq 'LATITUDE') { $prismaType = "Decimal @db.Decimal(9, 6)" }
            elseif ($colType -eq 'LONGITUDE') { $prismaType = "Decimal @db.Decimal(9, 6)" }
            elseif ($colType -eq 'COLOR_HEX') { $prismaType = "String @db.VarChar(7)" }
            else { $prismaType = "String # TODO: Unknown type $colType" }
        }
        
        $fieldName = ($col.name -replace '_([a-z])', { $matches[1].ToUpper() })
        
        $nullAttr = if (-not $col.notNull) { "?" } else { "" }
        $defaultAttr = ""
        
        if ($col.name -eq 'id' -and $colType -eq 'UUID') {
            if ($col.rawDef -match 'generate_primary_key') {
                $defaultAttr = " @default(dbgenerated(""gen_random_uuid()""))"
            } elseif ($col.rawDef -match 'gen_random_uuid') {
                $defaultAttr = " @default(dbgenerated(""gen_random_uuid()""))"
            }
        }
        
        if ($col.name -eq 'created_at' -and $col.hasDefault) {
            $defaultAttr = " @default(now())"
        }
        if ($col.name -eq 'updated_at') {
            $defaultAttr = " @updatedAt"
        }
        if ($col.name -eq 'version' -and $col.hasDefault) {
            $defaultAttr = " @default(1)"
        }
        
        $line = "  ${fieldName}${nullAttr}  ${prismaType}${defaultAttr} @map(""$($col.name)"")"
        $sb.AppendLine($line) | Out-Null
    }
    
    $sb.AppendLine("  @@map(""$tableName"")") | Out-Null
    $sb.AppendLine("}") | Out-Null
    $sb.AppendLine("") | Out-Null
}

# Write output
$sb.ToString() | Set-Content -Path $OutputFile -Encoding UTF8
Write-Host "Done! Schema written to $OutputFile" -ForegroundColor Green
Write-Host "Total enums: $($processedEnums.Count)" -ForegroundColor Yellow
Write-Host "Total tables: $($tables.Count)" -ForegroundColor Yellow
