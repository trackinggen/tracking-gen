import axios from 'axios'
import { genMultiple } from './genCode.js'

const getSimpleJsonLink = (codes) => {
  return `https://global.cainiao.com/global/check.json?&mailNos=${codes.join(
    '&mailNos='
  )}`
}

const getDetailedJsonLink = (codes) => {
  return `https://global.cainiao.com/global/detail.json?mailNos=${codes.join(
    ','
  )}&lang=en-US&language=en-US`
}

const getData = (req, res) => {
  const baseCode = req.params.baseCode

  const codes = genMultiple(baseCode)
  const groupsOf100 = []
  let validCodes = []

  for (let i = 0; i < 10; i++) {
    const val = i * 100
    const part = codes.slice(val, val + 100)
    groupsOf100.push(part)
  }

  const promises = groupsOf100.map((group) => {
    return new Promise((resolve, reject) => {
      axios
        .get(getSimpleJsonLink(group))
        .then((res) => {
          const valid = res.data.module
            .filter((e) => e.source == 'AE')
            .map((e) => e.mailNo)
          validCodes = [...validCodes, ...valid]
          resolve(res.data)
        })
        .catch((e) => {
          reject(e)
        })
    })
  })

  Promise.all(promises).then(() => {
    axios.get(getDetailedJsonLink(validCodes)).then((response) => {
      const result = response.data.module
        .map((e) => {
          const firstDetail = e.detailList[e.detailList.length - 1]
          return {
            code: e.mailNo,
            time: firstDetail.time,
          }
        })
        .filter((e) => {
          const objectDate = new Date(e.time)
          const now = new Date(Date.now())

          const isOlderThan5Days =
            +now > objectDate.setDate(objectDate.getDate() + 5)
          /* if (!isOlderThan5Days) return e */
          return e
        })

      result.sort((a, b) => {
        return new Date(b.time) - new Date(a.time)
      })

      res.setHeader('Content-Type', 'application/json')
      res.status(200)
      res.json(result)
    })
  })
}

export default getData
