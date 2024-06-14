import getData from './utils/getData.js'
import express from 'express'
import path from 'path'
import axios from 'axios'
import { genMultiple } from './utils/genCode.js'

const hostname = 'localhost'
const port = process.env.PORT || 8080
const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), '/index.html'))
})

app.post('/melhorrastreio/:baseCode/:range?', (req, res) => {
  const baseCode = req.params.baseCode
  const range = req.params?.range || 0
  const codes = genMultiple({ code: baseCode, range })
  const results = []
  const proxyList = req.body?.proxyList || []
  const proxies = []
  let proxyIndex = 0
  let tries = 0

  const createProxyObject = (string) => {
    const urlObj = new URL(string)

    return {
      host: urlObj.hostname,
      port: urlObj?.port,
      auth: urlObj?.username
        ? { username: urlObj.username, password: urlObj.password }
        : undefined,
      protocol: urlObj.protocol.replace(':', ''),
    }
  }

  proxyList.forEach((proxyString) => {
    if (proxyString) {
      proxies.push(createProxyObject(proxyString))
    }
  })

  console.log(`Proxy: ${JSON.stringify(proxies?.[proxyIndex] || {})}`)

  const promiseFactory = (code) => {
    return new Promise((resolve, reject) => {
      console.log(`Running query for code ${code}`)
      axios
        .post('https://api.melhorrastreio.com.br/graphql', {
          proxy: { ...proxies?.[proxyIndex] },
          query: `mutation searchParcel ($tracker: TrackerSearchInput!) {
            result: searchParcel (tracker: $tracker) {
              id
              createdAt
              updatedAt
              lastStatus
              lastSyncTracker
              pudos {
                type
                trackingCode
              }
              trackers {
                type
                shippingService
                trackingCode
              }
              trackingEvents {
                trackerType
                trackingCode
                createdAt
                translatedEventId
                description
                to
                from
                location {
                  zipcode
                  address
                  locality
                  number
                  complement
                  city
                  state
                  country
                }
                additionalInfo
              }
              pudoEvents {
                pudoType
                trackingCode
                createdAt
                translatedEventId
                description
                from
                to
                location {
                  zipcode
                  address
                  locality
                  number
                  complement
                  city
                  state
                  country
                }
                additionalInfo
              }
            }
          }`,
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
              (e) => e.description == 'Objeto postado'
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
          if (e.response.status == 429 && tries < 3) {
            tries += 1
            console.log(`Retrying for code ${code}, attempt ${tries}`)
            promiseFactory(code)
          } else {
            console.log(`Request to code ${code} failed: ${e.message}`)
            resolve()
          }
        })
    })
  }

  const promises = codes.map((code) => {
    return promiseFactory(code)
  })

  Promise.all(promises)
    .then(() => {
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
    .catch((e) => {
      console.log(e)
    })
})

app.get('/cainiao/:baseCode', (req, res) => {
  getData(req, res)
})

app.listen(port, (error) => {
  if (error) throw error
  console.log(`Server running at http://${hostname}:${port}/`)
})
