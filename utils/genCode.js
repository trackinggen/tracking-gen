const padWithLeadingZeros = (num, totalLength) => {
  return String(num).padStart(totalLength, '0')
}

const genCode = (baseCode = '') => {
  const randomNumber = padWithLeadingZeros(Math.floor(Math.random() * 9999), 4)
  const newCode = baseCode.replace(/(\d{4})(?!.*\d)/g, randomNumber)
  return newCode
}

export const genMultiple = (baseCode, number = 1000) => {
  const result = []

  for (let index = 0; index < number; index++) {
    result.push(genCode(baseCode))
  }

  return result
}

export default genCode
