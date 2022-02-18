const fs = require('fs')
const net = require('net')
const blessed = require('blessed')
const SerialPort = require('serialport')
const strip = require('strip-color')

const bulbs = []

const hexChar =
        [
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd',
          'e', 'f'
        ]

const cycleColor = async () => {
  let v = 0
  while (1) {
    const b = (v % 2 === 0) ? 4 : 1
    const h = v % 256
    const seq = v % 256
    const seqHex = hexChar[Math.floor(seq / 16)] + hexChar[seq % 16]

    const cmd = `b01bc0de${seqHex}a5a5a5a50001` +
      `000280${hexChar[Math.floor(h / 16)]}${hexChar[h % 16]}ff400002` + '00000000000000'

    port.write(cmd + '\n', 'ascii', () => log(cmd))

    v++

    await new Promise((res, rej) => setTimeout(() => res(null), 220))
  }
}

const tripleColor = async () => {
  let v = 0
  const colors =
      [
        '008040',
        '808040',
      ]

// b01bc0de02a5a5a5a50001100200004010ff6000000000000000
  while (1) {
    const seq = v % 256
    const seqHex = hexChar[Math.floor(seq / 16)] + hexChar[seq % 16]
    const color = colors[v % colors.length]
    //               b01bc0de00       a5a5a5a500011002000020 88ff33 00000000000000
    const cmdline = `b01bc0de${seqHex}a5a5a5a500031002000005${color}00000000000000\n`
    port.write(cmdline, 'ascii', () => log(cmdline.trim()))
    v++
    await new Promise((res, rej) => setTimeout(() => res(null), 600))
  }
}

const args = process.argv.slice(2)
const idx = args.indexOf('-p')
if (idx === -1 || idx === args.length - 1) {
  console.log('port path not found')
  console.log('example: node screen.js -p /dev/ttyUSB0')
  process.exit(1)
}

const port = new SerialPort(args[idx + 1], { baudRate: 115200 })
port.on('error', (err) => {
  console.log('Port Error: ', err.message)
})

port.on('data', data => {
  const line = strip(data.toString().trim())
  // log('serial: ' + line)

  const segments = line.split(' ')
  if (segments.length === 3 && segments[0] === 'bulbcast') {
    if (!bulbs.includes(segments[1])) {
      log('new device found: ' + segments[1])
      bulbs.push(segments[1])
    }

    log(line)
  }
})

const screen = blessed.screen()
const body = blessed.box({
  top: 0,
  left: 0,
  height: '100%-1',
  width: '100%',
  keys: false,
  mouse: true,
  alwaysScroll: true,
  scrollable: true,
  scrollbar: { ch: ' ', bg: 'red' }
})

const inputBar = blessed.textbox({
  bottom: 0,
  left: 0,
  height: 1,
  width: '100%',
  keys: true,
  mouse: true,
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: 'blue' // Blue background so you see this is different from body
  }
})

// Add body to blessed screen
screen.append(body)
screen.append(inputBar)

// Handle submitting data
inputBar.on('submit', (text) => {
  if (text === 'exit') {
    process.exit(0)
  } else if (text === 'clear') {
    body.setContent('')
  } else if (text.startsWith('cycle color')) {
    cycleColor().then(() => {}).catch(err => {})
  } else if (text.startsWith('tricolor')) {
    tripleColor().then(() => {}).catch(err => {})
  } else {
    log(text)
  }
  inputBar.clearValue()
  screen.render()
  inputBar.focus()
})

// Add text to body (replacement for console.log)
const log =
    (text) => {
      body.pushLine(text)
      screen.render()
    }

// Listen for enter key and focus input then
screen.key('enter', (ch, key) => { inputBar.focus() })

fs.readFile('assets/hello-world.bin', (err, buf) => {
  if (err) return
  const size = Buffer.alloc(4)
  size.writeUInt32LE(buf.length)
  const hash = buf.slice(buf.length - 32).toString('hex')
  log(`full digest: ${hash}`)
  log(`sha80: ${hash.slice(0, 20)}`)
  const server = net.createServer(socket => socket.on('data', data => {
    const text = data.toString()
    log(text)
    if (text[text.length - 1] === '\n') {
      const kv = text.trim().split(' ')
      if (kv.length === 2 && kv[0] === 'GET' &&
                              kv[1].length === 20 && hash.startsWith(kv[1])) {
        socket.write(Buffer.concat([size, buf]))
      }
    }
    socket.end()
  })).listen({ host: '10.42.0.1', port: 6016 }, () => {
    log('start listening at 6016')
    inputBar.focus()
  })
})
