const SerialPort = require('serialport')

const code = i => {
  const r = Buffer.from([Math.floor(Math.random() * 256)]).toString('hex')
  if (i % 3 === 0) {
    return `b01bca57200810${r}a5a5a5a700ff0720ee00000000\n`
  } else if (i % 3 === 1) {
    return `b01bca57200810${r}a5a5a5a700ff072000ee000000\n`
  } else if (i % 3 === 2) {
    return `b01bca57200810${r}a5a5a5a7008007200000ee0000\n`
  }
}

let started = false
let index = 0

const port = new SerialPort('/dev/ttyUSB1', { baudRate: 115200 })
port.on('data', data => {
  process.stdout.write(data.toString())
  if (!started) {
    setInterval(() => {
      port.write(code(index++))
    }, 500)
    started = true
  }
})
