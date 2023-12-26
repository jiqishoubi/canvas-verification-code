import './source'

// document.getElementById('btn').addEventListener('click', () => {
//   new CanvasVerificationCode({
//     el: document.getElementById('code_container'),
//     width: 100,
//     height: 50,
//     code: '1234',
//   })
// })

window.onload = () => {
  // @ts-ignore
  new CanvasVerificationCode({
    el: document.getElementById('code_container'),
    imgArr: [
      `https://filedown.bld365.com/tuike/upload/file/doctor-user-mp/20231225/F202312256f9ad600011.png`,
      `https://filedown.bld365.com/tuike/upload/file/doctor-user-mp/20231225/F2023122573424000012.png`,
    ],
  })
}
