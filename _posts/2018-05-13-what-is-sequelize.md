---
layout: post
title: ORM과 Sequelize
date: 2018-05-04 +0900
author: kyhsa93
categories: node.js
cover: "/assets/sequelize.png"
---

`Sequelize.js`를 쓰게 되어서 ORM과 Sequelize에 대해 정리를 좀 해보면 좋을거 같다는 생각을 하게 되었다.

What is ORM?
---

`ORM(Object Relational Mapping)`은 Application과 Database를 mapping 해주는 도구이다.

ORM의 장점은 다음과 같다.

0. 특정 DBMS에 종속되지 않는다.
0. SQL문이 코드에 들어가지 않아 깔끔한 코드를 유지할 수 있다.
0. ORM이 nesting data를 bind 해준다.

ORM의 단점은 다음과 같다.

0. Raw query에 비해 performance가 느리다.
0. Query tuning이 힘들다.
0. 서비스가 복잡해 질수록 ORM으로 할 수 있는 작업의 범위에 한계가 있다.

참조 링크

[What is ORM](https://stackoverflow.com/questions/1279613/what-is-an-orm-and-where-can-i-learn-more-about-it)
, [Pros and Cons](https://www.quora.com/What-are-the-pros-and-cons-of-using-raw-SQL-versus-ORM-for-database-development)

What is Sequelize?
---

`Sequelize.js`는 `PostgreSQL`, `MySQL`, `MariaDB`, `SQLite`, `MSSQL`을 지원하고 relation, read replication 등도 지원한다.

가장 큰 특징은 `Promise`를 기본으로 동작한다.

`Promise`의 특징은 다음과 같다.

0. Method chaining을 통해 값을 전달하거나 연속된 일련의 작업을 처리할 수 있다.

Setting up connection
---

`Sequelize.js` 설치는 `npm`으로 진행한다.

```
  npm install sequelize
```

사용할 database에 따라 필요한 모듈을 설치해 줘야하니 확인해보는 것을 추천한다.

Connection에 대한 정보는 `Sequelize` 객체를 생성할 때 Parameter로 들어간다.

```js
  new Sequelize(database, [username=null], [password=null], [options={}])
```

Model Define
---

`Sequelize`에서 model은 Database table을 표현한다.

model에 대한 정의는 `Sequelize`의 define method를 이용한다.

```
  sequelize.define()
```

`define`의 두번째 parameter의 대표적인 값들은 다음과 같다.

0. `type` : Data type
0. `primaryKey` : 기본키 인지 아닌지 설정 (default: false)
0. `autoIncrement` : SERIAL(auto increment)인지 아닌지 (default: false)
0. `allowNull` : NOT NULL 조건인지 아닌지 (default: true)
0. `unique` : Unique조건인지 아닌지에 대한 옵션. column하나로만 이루어진 unique라면 true/false로 지정한다. 복수개의 column이라면 동일한 문자열을 각 column의 unique속성에 넣어준다.
0. `comment` : column에 대한 comment
0. `validate` : 각 column에 대한 validation check옵션을 넣어준다.

`define`의 세번째 parameter의 대표적인 값들은 다음과 같다.

0. `timestamps` : Sequelize는 테이블을 생성한 후 자동적으로 createdAt, updatedAt column을 생성한다. Database에 해당 테이블이 언제 생성되었고 가장 최근에 수정된 시간이 언제인지 추적할 수 있도록 해준다. 기능을 끄려면 false로 설정한다.
0. `paranoid` : paranoid가 true이면 deletedAt column이 table에 추가된다. 해당 row를 삭제시 실제로 데이터가 삭제되지 않고 deletedAt에 삭제된 날짜가 추가되며 deletedAt에 날짜가 표기된 row는 find작업시 제외된다. 즉 데이터는 삭제되지 않지만 삭제된 효과를 준다. timestamps 옵션이 true여야만 사용할 수 있다.
0. `underscored` : true이면 column이름을 camalCase가 아닌 underscore방식으로 사용한다.
0. `freezeTableName` : Sequelize는 `define` method의 첫번째 파라미터 값으로 tablename을 자동변환하는데 true이면 이작업을 하지 않도록 한다.
0. `tableName` : 실제 Table name
0. `comment` : table 에 대한 comment

Data type
---

Sequelize에서 지원하는 Data Type은 다음과 같다.(sequelize 공식 사이트에서 발췌)

```js
  Sequelize.STRING                      // VARCHAR(255)
  Sequelize.STRING(1234)                // VARCHAR(1234)
  Sequelize.STRING.BINARY               // VARCHAR BINARY
  Sequelize.TEXT                        // TEXT

  Sequelize.INTEGER                     // INTEGER
  Sequelize.BIGINT                      // BIGINT
  Sequelize.BIGINT(11)                  // BIGINT(11)

  Sequelize.FLOAT                       // FLOAT
  Sequelize.FLOAT(11)                   // FLOAT(11)
  Sequelize.FLOAT(11, 12)               // FLOAT(11,12)

  Sequelize.REAL                        // REAL        PostgreSQL only.
  Sequelize.REAL(11)                    // REAL(11)    PostgreSQL only.
  Sequelize.REAL(11, 12)                // REAL(11,12) PostgreSQL only.

  Sequelize.DOUBLE                      // DOUBLE
  Sequelize.DOUBLE(11)                  // DOUBLE(11)
  Sequelize.DOUBLE(11, 12)              // DOUBLE(11,12)

  Sequelize.DECIMAL                     // DECIMAL
  Sequelize.DECIMAL(10, 2)              // DECIMAL(10,2)

  Sequelize.DATE                        // DATETIME for mysql / sqlite, TIMESTAMP WITH TIME ZONE for postgres
  Sequelize.BOOLEAN                     // TINYINT(1)

  Sequelize.ENUM('value 1', 'value 2')  // An ENUM with allowed values 'value 1' and 'value 2'
  Sequelize.ARRAY(Sequelize.TEXT)       // Defines an array. PostgreSQL only.

  Sequelize.JSON                        // JSON column. PostgreSQL only.
  Sequelize.JSONB                       // JSONB column. PostgreSQL only.

  Sequelize.BLOB                        // BLOB (bytea for PostgreSQL)
  Sequelize.BLOB('tiny')                // TINYBLOB (bytea for PostgreSQL. Other options are medium and long)

  Sequelize.UUID                        // UUID datatype for PostgreSQL and SQLite, CHAR(36) BINARY for MySQL (use defaultValue: Sequelize.UUIDV1 or Sequelize.UUIDV4 to make sequelize generate the ids automatically)

  Sequelize.RANGE(Sequelize.INTEGER)    // Defines int4range range. PostgreSQL only.
  Sequelize.RANGE(Sequelize.BIGINT)     // Defined int8range range. PostgreSQL only.
  Sequelize.RANGE(Sequelize.DATE)       // Defines tstzrange range. PostgreSQL only.
  Sequelize.RANGE(Sequelize.DATEONLY)   // Defines daterange range. PostgreSQL only.
  Sequelize.RANGE(Sequelize.DECIMAL)    // Defines numrange range. PostgreSQL only.

  Sequelize.ARRAY(Sequelize.RANGE(Sequelize.DATE)) // Defines array of tstzrange ranges. PostgreSQL only.
```

Integer, BigINT, Float, Double type에는 unsinged와 zerofill에 대한 옵션도 지정할 수 있다.

```js
  Sequelize.INTEGER.UNSIGNED              // INTEGER UNSIGNED
  Sequelize.INTEGER(11).UNSIGNED          // INTEGER(11) UNSIGNED
  Sequelize.INTEGER(11).ZEROFILL          // INTEGER(11) ZEROFILL
  Sequelize.INTEGER(11).ZEROFILL.UNSIGNED // INTEGER(11) UNSIGNED ZEROFILL
  Sequelize.INTEGER(11).UNSIGNED.ZEROFILL // INTEGER(11) UNSIGNED ZEROFILL
```

zerofill은 남은 자리수를 0으로 채우는 방식이다.

<div style="text-align: right">
  Image source by
  <a href="https://medium.com/riipen-engineering/testing-with-sequelize-cc51dafdfcf4">
    here
  </a>
</div>
