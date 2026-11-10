# Material Media Effect Tool

Material Media 그래픽 모티프 생성 웹 도구. 6개 뉴미디어 대범주(영상·사운드, 소프트웨어, 네트워크, 라이트·키네틱, 퍼포먼스, 디지털 이미지)의 그래픽을 Three.js 선으로 그린다.

빌드 없이 동작하는 정적 사이트다. GitHub Pages에서 `main` 브랜치의 루트를 배포한다.

| 파일 | 역할 |
|---|---|
| `index.html` | 페이지 구조, 라이브러리 불러오기 (three, mp4-muxer: jsDelivr CDN) |
| `style.css` | UI 스타일 |
| `brand.js` | 브랜드 색, 범주 정의 |
| `i18n.js` | 한국어 / 영어 문구 |
| `script.js` | 그래픽, 사이드바, 카메라, 내보내기 |
