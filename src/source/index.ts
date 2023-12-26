import './index.less'

const blockSize = 40
const blockCircleRadius = 7
const blockGap = 2
const allBlockSize = blockSize + blockCircleRadius * 2

function isIE() {
  return window.navigator.userAgent.indexOf('Trident') > -1
}

function getRandomNumberByRange(start: number, end: number) {
  return Math.round(Math.random() * (end - start) + start)
}

function _draw(ctx: CanvasRenderingContext2D, x: number, y: number, operation: 'fill' | 'clip') {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arc(x + blockSize / 2, y - blockCircleRadius + blockGap, blockCircleRadius, 0.75 * Math.PI, 2.25 * Math.PI)
  ctx.lineTo(x + blockSize, y)
  ctx.arc(x + blockSize + blockCircleRadius - blockGap, y + blockSize / 2, blockCircleRadius, 1.25 * Math.PI, 2.75 * Math.PI)
  ctx.lineTo(x + blockSize, y + blockSize)
  ctx.lineTo(x, y + blockSize)
  ctx.arc(x + blockCircleRadius - blockGap, y + blockSize / 2, blockCircleRadius, 2.75 * Math.PI, 1.25 * Math.PI, true)
  ctx.lineTo(x, y)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fill()
  ctx[operation]()
  ctx.globalCompositeOperation = isIE() ? 'xor' : 'overlay'
}

interface ICanvasVerificationCodeOptions {
  el: HTMLElement
  width?: number
  height?: number
  imgArr: string[]
  onRefresh?: () => void
  onSuccess?: () => void
  onFail?: () => void
}

class CanvasVerificationCode {
  options: {
    el: HTMLElement
    width: number
    height: number
    imgArr: string[]
    onRefresh?: () => void
    onSuccess?: () => void
    onFail?: () => void
  }
  doms: {
    el: HTMLElement
    canvas: HTMLCanvasElement
    canvasCtx: CanvasRenderingContext2D
    blockCanvas: HTMLCanvasElement
    blockCtx: CanvasRenderingContext2D
    refreshIcon: HTMLElement
    sliderContainer: HTMLElement
    sliderTrack: HTMLElement
    slider: HTMLElement
  }
  vars: {
    blockX?: number
    blockY?: number
    trail: number[]
    finish: boolean
  } = {
    trail: [],
    finish: false,
  }

  constructor(options: ICanvasVerificationCodeOptions) {
    const defaultOptions = {
      width: 300,
      height: 150,
    }
    this.options = Object.assign(defaultOptions, options)
    this.doms = this.initDoms()
    this.bindEvents()
    this.initImg()
  }

  initDoms() {
    const el = this.options.el
    el.classList.add('verification_code_container')
    el.style.width = this.options.width + 'px'

    const canvas = document.createElement('canvas')
    canvas.width = this.options.width
    canvas.height = this.options.height
    canvas.classList.add('verification_code_canvas')

    const blockCanvas = canvas.cloneNode(true) as HTMLCanvasElement
    blockCanvas.classList.add('verification_code_block')

    const sliderContainer = document.createElement('div')
    sliderContainer.classList.add('verification_code_sliderContainer')
    sliderContainer.innerHTML = `
      <div class='verification_code_sliderBg'>
        <span class='verification_code_tip_text'>向右滑动滑块填充拼图</span>
      </div>
      <div class='verification_code_track'>
        <div class='verification_code_track_content'></div>
      </div>
      <div class='verification_code_slider'>
        箭头
      </div>
    `

    const refreshIcon = document.createElement('div')
    refreshIcon.classList.add('verification_code_refreshIcon')

    el.appendChild(canvas)
    el.appendChild(blockCanvas)
    el.appendChild(sliderContainer)
    el.appendChild(refreshIcon)

    return {
      el,
      canvas,
      canvasCtx: canvas.getContext('2d') as CanvasRenderingContext2D,
      blockCanvas,
      blockCtx: blockCanvas.getContext('2d') as CanvasRenderingContext2D,
      refreshIcon,
      sliderContainer,
      sliderTrack: sliderContainer.querySelector('.verification_code_track') as HTMLElement,
      slider: sliderContainer.querySelector('.verification_code_slider') as HTMLElement,
    }
  }

  initImg() {
    const x = getRandomNumberByRange(allBlockSize, this.options.width - allBlockSize)
    const y = getRandomNumberByRange(blockCircleRadius * 2, this.options.height - blockSize)
    this.vars.blockX = x
    this.vars.blockY = y

    _draw(this.doms.canvasCtx, x, y, 'fill')
    _draw(this.doms.blockCtx, x, y, 'clip')

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = this.options.imgArr[0]
    img.onload = () => {
      this.doms.canvasCtx.drawImage(img, 0, 0, this.options.width, this.options.height)
      this.doms.blockCtx.drawImage(img, 0, 0, this.options.width, this.options.height)
      const imageData = this.doms.blockCtx.getImageData(x, y - blockCircleRadius * 2, allBlockSize, allBlockSize)
      this.doms.blockCanvas.width = allBlockSize
      this.doms.blockCtx.putImageData(imageData, 0, y - blockCircleRadius * 2)
    }
  }

  bindEvents() {
    let originX: number,
      originY: number,
      trail: number[] = [],
      isMouseDown = false

    this.doms.el.onselectstart = () => false
    this.doms.refreshIcon.onclick = () => {
      this.reset()
      this.options.onRefresh?.()
    }

    const handleDragStart = (e: any) => {
      if (this.vars.finish) return false
      isMouseDown = true
      originX = e.clientX || e.touches[0].clientX
      originY = e.clientY || e.touches[0].clientY
      this.doms.el.classList.add('dragging')
      document.querySelector('.verification_code_tip_text')!.innerHTML = ''
    }

    const handleDragMove = (e: any) => {
      if (!isMouseDown) return false
      const eventX = e.clientX || e.touches[0].clientX
      const eventY = e.clientY || e.touches[0].clientY
      const moveX = eventX - originX
      const moveY = eventY - originY
      if (moveX < 0 || moveX + 40 > this.options.width) return false
      const blockCanvasLeft = ((this.options.width - allBlockSize) / (this.options.width - blockSize)) * moveX
      this.doms.blockCanvas.style.left = blockCanvasLeft + 'px'
      this.doms.sliderTrack.style.width = moveX + 'px'
      this.doms.slider.style.left = moveX + 'px'
      trail.push(moveY)
    }

    const handleDragEnd = (e: any) => {
      if (!isMouseDown) return false
      isMouseDown = false
      this.vars.finish = true
      const eventX = e.clientX || e.changedTouches[0].clientX
      if (eventX == originX) return false
      this.vars.trail = trail
      const { verified, success } = this.verify()
      if (success) {
        if (verified) {
          // 人为
          this.doms.el.classList.add('success')
          this.options.onSuccess?.()
        } else {
          // 非人为
          this.doms.el.classList.add('fail')
          this.options.onFail?.()
        }
      } else {
        // 验证失败 没对准
        this.doms.el.classList.add('fail')
        this.options.onFail?.()
        setTimeout(() => {
          this.reset()
        }, 800)
      }
    }

    this.doms.slider.addEventListener('mousedown', handleDragStart)
    this.doms.slider.addEventListener('touchstart', handleDragStart)
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('touchmove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchend', handleDragEnd)
  }

  verify() {
    const arr = this.vars.trail // 拖动时y轴的移动距离
    const average = arr.reduce((a, b) => a + b) / arr.length
    const deviations = arr.map((x) => x - average)
    const stddev = Math.sqrt(deviations.map((a, b) => a * b).reduce((a, b) => a + b) / arr.length) // // 简单验证下拖动轨迹，为零时表示Y轴上下没有波动，可能非人为操作
    const verified = stddev !== 0

    const left = parseInt(this.doms.blockCanvas.style.left)
    const success = this.vars.blockX && Math.abs(left - this.vars.blockX) < 5

    return {
      verified,
      success,
    }
  }

  reset() {
    this.vars = {
      trail: [],
      finish: false,
    }

    this.doms.blockCanvas.style.left = '0px'
    this.doms.el.classList.remove('dragging', 'success', 'fail')
    this.doms.sliderTrack.style.width = '0px'
    this.doms.slider.style.left = '0px'

    this.doms.canvasCtx.clearRect(0, 0, this.options.width, this.options.height)
    this.doms.blockCtx.clearRect(0, 0, this.options.width, this.options.height)
    this.doms.blockCanvas.width = this.options.width

    this.initImg()
  }
}

// @ts-ignore
window.CanvasVerificationCode = CanvasVerificationCode
