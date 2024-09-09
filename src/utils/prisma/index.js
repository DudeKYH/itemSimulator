import { PrismaClient } from "@prisma/client";

/*      Prisma ORM(Object-Relational-Mapping) 종류        */
// 1. Prisma Client
//  - Node.js 및 TypeScript를 위한 자동 생성 및 유형 안전 쿼리 빌더
// 2. Prisma Migrate
//  - 마이그레이션 시스템
//  - 마이그레이션? => 현재 환경(ex>MySQL)의 DB 데이터를 다른 환경(ex>Oracle)의 DB에 옮기는 과정
// 3. Prisma Studio
//  - DB의 데이터를 보고 편집할 수 있는 GUI

/*     Prisma ORM 기능          */
// - RDB의 데이터들을 자동으로 Object로 Mapping해준다.
//      => RawQuery로 작성할 때, javascript만으로 DB를 조작할 수 있게 되어
//         코드의 유지보수가 편하고, 객체지향적인 프로그래밍이 가능

// PrismaClient 인스턴스를 생성한다.
export const prisma = new PrismaClient({
  // Prisma를 이용해 DB에 접근할 때, SQL을 출력해줍니다.
  log: ["query", "info", "warn", "error"],

  // 에러 메시지를 평문이 아닌 개발자가 읽기 쉬운 형태로 출력해줍니다.
  // errorFormat Option
  //  1) pretty       : 색상이 적용된 스택 추적, 코드 구문 강조, 해결책이 담긴 확정된 오류 메세지가 춫력
  //  2) colorless    : pretty와 구문은 동일하지만, 색상 구분이 없다.
  //  3) minimal      : raw Error 메시지 출력
  errorFormat: "pretty",
});
