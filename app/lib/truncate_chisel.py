def compress_hpp_file(content: str) -> str:
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Keep empty lines and preprocessor directives
        if not stripped or stripped.startswith('#'):
            result.append(line)
            i += 1
            continue

        # Keep comments
        if stripped.startswith('//') or stripped.startswith('/*'):
            result.append(line)
            i += 1
            continue

        # Check if this looks like a function definition (has opening brace)
        # We look for lines that end with { or have { after )
        if '{' in line:
            # If it's just a brace (namespace, class, struct, etc.), keep it
            if stripped == '{' or stripped.startswith('namespace') or \
               stripped.startswith('class') or stripped.startswith('struct') or \
               stripped.startswith('enum') or stripped.startswith('union'):
                result.append(line)
                i += 1
                continue

            # This is likely a function definition - skip until closing brace
            brace_count = line.count('{') - line.count('}')
            i += 1

            # Skip lines until we balance the braces
            while i < len(lines) and brace_count > 0:
                brace_count += lines[i].count('{') - lines[i].count('}')
                i += 1
            continue

        # Otherwise, keep the line (prototypes, variable declarations, etc.)
        result.append(line)
        i += 1

    return '\n'.join(result)