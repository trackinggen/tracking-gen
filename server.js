import getData from './utils/getData.js'
import express from 'express'
import path from 'path'
import axios from 'axios'
import { genMultiple } from './utils/genCode.js'

const hostname = 'localhost'
const port = process.env.PORT || 8080
const app = express()

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), '/index.html'))
})

app.get('/melhorrastreio/:baseCode/:range?', (req, res) => {
  const baseCode = req.params.baseCode
  const range = req.params?.range || 0
  const codes = genMultiple({ code: baseCode, range })
  const results = []

  const promises = codes.map((code) => {
    return new Promise((resolve, reject) => {
      axios
        .post('https://novo.melhorrastreio.com.br/graphql', {
          query:
            'mutation searchParcel ($tracker: TrackerSearchInput!) {\n  result: searchParcel (tracker: $tracker) {\n    id\n    createdAt\n    updatedAt\n    lastStatus\n    lastSyncTracker\n    pudos {\n      type\n      trackingCode\n    }\n    trackers {\n      type\n      shippingService\n      trackingCode\n    }\n    trackingEvents {\n      trackerType\n      trackingCode\n      createdAt\n      translatedEventId\n      originalTitle\n      to\n      from\n    }\n    pudoEvents {\n      trackingCode\n      createdAt\n      translatedEventId\n      originalTitle\n      from\n      to\n      pudoType\n    }\n  }\n}',
          variables: {
            tracker: {
              trackingCode: code,
              type: 'correios',
            },
          },
        })
        .then((r) => {
          const object = r.data.data.result
          if (object) {
            const objectPostedActivity = object.trackingEvents.find(
              (e) => e.originalTitle == 'Objeto postado'
            )

            if (objectPostedActivity) {
              const time = new Date(objectPostedActivity.createdAt).getTime()
              results.push({
                time,
                code: objectPostedActivity.trackingCode,
              })
            }
          }
          resolve()
        })
        .catch((e) => {
          reject(e)
        })
    })
  })

  Promise.all(promises).then(() => {
    results.sort((a, b) => {
      return new Date(b.time) - new Date(a.time)
    })
    const recentResults = results.filter((e) => {
      const objectDate = new Date(e.time)
      const now = new Date(Date.now())

      const isOlderThan5Days =
        +now > objectDate.setDate(objectDate.getDate() + 5)
      if (!isOlderThan5Days) return e
    })

    res.json(recentResults)
  })
})

app.get('/cainiao/:baseCode', (req, res) => {
  getData(req, res)
})

app.listen(port, (error) => {
  if (error) throw error
  console.log(`Server running at http://${hostname}:${port}/`)
})
