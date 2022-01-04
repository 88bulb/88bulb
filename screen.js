const fs = require('fs')
const net = require('net')
const blessed = require('blessed')
const SerialPort = require('serialport')

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
//  console.log('data: ', data.toString().trim())
})

const screen = blessed.screen()
const body = blessed.box({
  top: 0,
  left: 0,
  height: '100%-1',
  width: '100%',
  keys: false,
  mouse: false,
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
