/**
 * JSON with one array element, or one object member of an object of
 * records, per line, so a regenerated file diffs row by row instead of as one
 * long line.
 */
export function stringifyOneRowPerLine(value: Record<string, unknown>): string {
  const lines: string[] = ['{']
  const keys = Object.keys(value)

  keys.forEach((key, index) => {
    const member = value[key]
    const comma = index < keys.length - 1 ? ',' : ''

    if (Array.isArray(member)) {
      lines.push(`  ${JSON.stringify(key)}: [`)
      member.forEach((row, i) => {
        lines.push(`    ${JSON.stringify(row)}${i < member.length - 1 ? ',' : ''}`)
      })
      lines.push(`  ]${comma}`)
    } else {
      lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(member)}${comma}`)
    }
  })

  lines.push('}', '')

  return lines.join('\n')
}
