# ItemSimulator with Node.js🔊🔊🔊

학습한 Node.js 문법을 최대한 활용하여 Item Simulator를 구현한 미니 개발프로젝트입니다.

---

## 💻개발 환경

- Visual Studio Code : Node.js로 개발하기 위한 코드 에디터로 사용
- GitHub : 원격 버전 관리를 위해 사용
- DBeaver : DB Client로 서버 테스트를 하면서 바뀌는 테이블을 쉽게 보기 위해 사용
- Insomnia : 개발 과정에서 테스트를 위한 API Client Tool로 사용
- Postman : API 명세서 작성 및 최종 테스트로 사용
- Used npm
  - express
  - bcrypt
  - prisma, @prisma/client
  - cookie-parse
  - joi
  - jsonwebtoken
  - dotenv
  - nodemon
  - prettier

---

## 📃API 명세서

- Postman을 활용하여 API 명세서를 작성해보았다.
- Postman는 API 명세서 작성 기능 뿐만 아니라 Insomnia와 같이 API Client도 가능했다.
- 사용해보니 처음이라 어색한 것도 있긴 하지만 Postman 이거 너무 좋다.
- 앞으로 많이 활용해보면서 익숙해보자~

👉🏻 [API 명세서 URL 링크](https://documenter.getpostman.com/view/38272046/2sAXqmB5wS)

---

## 💢어려웠거나 힘들었던 점

> ### **1. OAuth 2.0**

- **문제 상황**

  - 로그인을 하면 웹 서버는 JWT 토큰을 생성해서 response 헤더에 Authorization 필드에 토큰을 넣어서 클라이언트에게 전달해준다. Insomnia에서 로그인 API 후 Response로 Authorization에 JWT 토큰이 담긴 것을 확인했다.
    그런데, 로그인 후 다른 API를 요청했을 때, header에 authorization 필드에 존재하지 않았다!

- 왜 다른 API의 request의 헤더에 Authorization이 있어야 된다고 생각했는가?

  - 강의에서 Access Token을 활용하여 로그인을 구현할 때, response의 cookie에 담아서 보내줬는데,
  - Insomnia에서 쿠키 정보를 Manage Cookies에서 따로 관리하고 저장하고 있어 다른 APi를 호출하여도 인증 절차를 통과할 수 있었다. 이 기억을 가지고 당연히 나는 Header의 Authorization도 똑같이 적용될 거라도 예상했던 것이다!

- **깨달음!!**

  - 한참을 클라이언트가 API를 요청할 때마다 로그인 후 서버가 응답해준 authorization을 어떻게 해야 자동으로 header에 붙여줄 수 있을까를 찾으면서 방황하다가 `OAuth 2.0`을 찾아보게 되었고, 동작 방식을 보고 깨달았다.
  - **아... 뻘짓했구나!**
  - **서버가 Authorization에 Access Token을 보내주면 클라이언트측에서 이걸 보관하여 매 API를 요청할 때마다 header에 붙여준다는 것이다. 그런데 우리는 클라이언트를 직접 구현하지 않고, Insomnia로 클라의 역할을 대체하고 있었다. 따라서 Insomnia의 각 API 요청마다 JWT를 따로따로 수동으로 넣어줘야했다.**
  - `Insomnia의 Request -> Auth -> Bearer Token`을 설정해주면 로그인 시 받은 Authorization의 Value를 `Token, Prefix`로 넣어주니 인증 미들웨어가 정상적으로 검증이 되었다.

- **Postman**
  - itemSimulator를 얼추 완성해놓고, API 명세서를 만들기 위해 `Postman`이라는 API Platform을 사용해보았다.
  - Insomnia와 같이 API Client 기능도 제공했는데, 명세서를 작성할 겸 테스트도 같이 진행했는데,
    신세계였다. `Request -> Auth -> jwt Bearer` 선택 후 내가 서버에서 사용한 `Secret Key, Payload, Headers`를 그대로 입력해주면 **자동으로 JWT을 생성해줘서 Header의 Authrization에 붙여주었다.**
    또한, 다른 API에서도 Auth 설정을 자동으로 똑같게 해줬다.
  - 좀 더 빨리 알았다면 좋았겠지만, 지금이라도 알아서 다행인 생각이다. 앞으로 사용할 일이 생기면 자주 사용해보면서 숙련도를 늘리면 좋을 것 같다!

> ### **2. 원활한 테스트 진행이 어려웠다.**

- 코드만 구현하기 보단 여러가지 구현한 API를 테스트를 진행하면서 성공 상황과 여러 실패 상황을 모두 눈으로 봐야하는 건 당연한 것이다!
  - 하지만 이번 프로젝트는 `Visual Studio Code, Insomnia,  DBeaver, 구글링을 위한 크롬창까지!!!` 여러가지 Tool 들을 왔다갔다해야 되서 초반엔 정리가 안되어 있고 익숙하지 않아 테스트의 진행이 매우 더뎌서 힘들었다.
  - 듀얼 모니터로도 버거우니 트리플 모니터로 바꿔야하나 고민이 된다.

> ### **3. 캐릭터 상세조회의 경우 선택적으로 JWT 인증이 되어야 했다.**

- 로그인한 캐릭터를 상세조회하는 경우, 캐릭터의 Money까지 조회가 가능해야 한다.

- **새로운 선택 인증 미들 웨어 추가**

  - 여러가지를 시도해보다가, **기존 인증 미들 웨어를 살짝 변형시키면 좋다고 생각이 들었다.**
  - 기존 인증 미들 웨어는 에러 상황 발생하면 error를 발생시키고 바로 `next(error)`를 호출하여 에러 미들웨어로 이동한다.
  - 새로 추가한 선택 인증 미들웨어는 기존의 에러 상황 발생하더라도, `next()`를 호출하여 다음 라우팅인 상세조회 API로 이동하게끔 구현하였다.

- **Object가 undefined일 때 Object의 Property를 Read할 때 Error 발생!**
  - 이제 상세조회 API에서 처음엔 선택 인증 미들 웨어를 잘 통과햇는지 알기 위해 req.user에 user 정보가 담겨있는지로 판단하면 된다!
  - 여기서! 인증이 실패라면 req.user의 값은 undefined인데 여기서 req.user.userId를 읽으려고 할때 Error가 발생한다는 것을 알았다.
  - Undefiend Error를 해결하기 위해 javascript ES11에서 도입된 **`?(옵셔널 체이닝 연산자) 문법`**을 발견하게 되었고, 이를 활용하여 겨우 해결했다...!

---

## 💡내가 생각했을 때 보완해야 할 점

- **1. 코드 리팩토링**

  - 시간 부족으로 코드 리팩토링을 하지 못했다.
  - 현재 구현을 너무 하드코딩식으로 하다보니, 추후 리팩토링한다면,
  - API 구현 과정이 대부분 1)req.params, req.body에 대해 유효성 검사(joi) -> 2) 올바른 데이터인지 유효성 검사 -> 3) 실제 로직(CRUD) 처리로 되어 있다보니 과정마다 함수, 파일, 디렉토리로 따로 빼서 모듈화시키면 좋겠다고 생각이 든다...

- **2. 트랜잭션에 대한 고찰**
  - API를 구현하면서 여러 DB에 접근하게 되는데, 솔직히 지금은 혼자 테스트를 하다보니 문제가 생길 수 없지만, 많은 사용자들이 동시에 DB에 접근할 때에도 ACID가 보장되는지는 생각해볼 문제이다.

---

## 🤣끝으로

시간도 부족해서 만족스러운 결과물은 아닌 만큼 부족한 부분이 많을거 같은데 피드백으로 알려주시면 꼭 반영하도록 노력해보겠습니다. 감사합니다.
