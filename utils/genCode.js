const padWithLeadingZeros = (num, totalLength) => {
  return String(num).padStart(totalLength, '0')
}

const genCode = (baseCode = '', number) => {
  const newCode = baseCode.replace(
    /(\d{4})(?!.*\d)/g,
    padWithLeadingZeros(number, 4)
  )
  return newCode
}

export const genMultiple = ({ code, range }) => {
  const result = []
  const r = range * 1000
  const max = r + (range == 9 ? 999 : 1000)
  console.log(r, max)

  for (let index = r; index < max; index++) {
    result.push(genCode(code, index))
  }

  return result
}

export default genCode
