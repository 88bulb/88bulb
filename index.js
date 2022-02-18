const fs = require('fs')
const net = require('net')

// const filename = fs.readdirSync('assets')
//   .filter(x => x.match('^bulbcast-[0-9][0-9][0-9][0-9].bin$'))
//   .sort()
//   .pop()
//
// console.log(`latest bin: ${filename}`)
//

fs.readdir('assets', (err, files) => {
  if (err || files.length === 0) process.exit(1)

  const filename =
      files.filter(x => x.match('^bulbcast-[0-9][0-9][0-9][0-9].bin$'))
        .sort()
        .pop()

  console.log(`latest bin: ${filename}`)

  fs.readFile(`assets/${filename}`, (err, buf) => {
    if (err) { return }
    const size = Buffer.alloc(4)
    size.writeUInt32LE(buf.length)
    const hash = buf.slice(buf.length - 32).toString('hex')
    console.log(`sha256: ${hash}`)
    console.log(`sha80: ${hash.slice(0, 20)}`)
    console.log(`b01bb007a0764e689fb6${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e655e8e${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e653ba6${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e655eb2${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e655f26${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e655f3e${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e655ec6${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e689ffe${hash.slice(0, 20)}a5a5a5a50200`)
    console.log(`b01bb007a0764e655e92${hash.slice(0, 20)}a5a5a5a50200`)
    console.log('\n')


    const server =
          net.createServer(socket => socket.on(
            'data',
            data => {
              const text = data.toString()
              console.log(text)
              if (text[text.length - 1] === '\n') {
                const kv = text.trim().split(' ')
                if (kv.length === 2 && kv[0] === 'GET' &&
                                       kv[1].length === 20 &&
                                       hash.startsWith(kv[1])) {
                  console.log('right kv')
                  socket.write(Buffer.concat([size, buf]))
                } else {
                  console.log('wrong kv')
                }
              }
              socket.end()
            }))
            .listen({ host: '10.42.0.1', port: 6016 },
              () => console.log(server.address()))
  })
})
