# Quiz Server API

This is a Node.js server built with Express and SQLite3 that provides a RESTful API for a quiz application with user authentication and role-based access control.

## Features

- User registration and authentication with JWT
- Role-based authorization (admin/user)
- CRUD operations for quizzes
- Quiz question and answer management
- User experience points (exp) tracking
- Secure password storage (plaintext in this example - not recommended for production)

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /auth` - Authenticate user and get JWT token
- `GET /user` - Get current user info

### Quiz Management (Admin only)
- `GET /Quiz` - Get all quizzes
- `GET /Quiz/:id` - Get single quiz by ID
- `POST /Quiz` - Create new quiz
- `PUT /Quiz/:id` - Update quiz by ID
- `DELETE /Quiz/:id` - Delete quiz by ID

### Question Management (Admin only)
- `GET /QuestionsAdmin/:id` - Get all questions for a quiz
- `POST /QuizQuestion/:id` - Add question to quiz
- `PUT /QuizQuestion/:qid` - Update question
- `DELETE /QuizQuestion/:qid` - Delete question

### Answer Management (Admin only)
- `GET /AnswersAdmin/:qid` - Get all answers for a question
- `POST /QuizAnswer/:qid` - Add answer to question
- `PUT /QuizAnswer/:aid` - Update answer
- `DELETE /QuizAnswer/:aid` - Delete answer

### User Experience (Admin only)
- `POST /UserExp/:id` - Update user's experience points

### Quiz Taking (Authenticated users)
- `GET /QuizQustionsForUser/:id` - Get all question IDs for a quiz
- `GET /QuizQustionForUser/:qid` - Get question and answer options
- `POST /QuizAnswerForUser/:aid` - Submit answer to question

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install express sqlite3 jsonwebtoken
   ```
3. Create a SQLite database file `db.db` with the required tables:
   - `user` (id, login, password, exp, role)
   - `Quiz` (Id, Text, Description)
   - `Questions` (id, qid, question, type)
   - `Answers` (qid, aid, text, explanation, true, image)

4. Start the server:
   ```bash
   node server.js
   ```

## Configuration

- Server port can be configured via environment variable `PORT` (default: 3000)
- JWT secret key is set in `tokenKey` variable
- Database file is `./db.db`

---

# Quiz Server API

Это сервер на Node.js с использованием Express и SQLite3, предоставляющий REST API для системы викторин с аутентификацией пользователей и ролевым доступом.

## Возможности

- Регистрация и аутентификация пользователей с JWT
- Ролевая модель доступа (админ/пользователь)
- CRUD-операции для викторин
- Управление вопросами и ответами
- Система накопления опыта (exp) для пользователей
- Хранение паролей (в открытом виде - не рекомендуется для продакшена)

## API Эндпоинты

### Аутентификация
- `POST /register` - Регистрация нового пользователя
- `POST /auth` - Аутентификация и получение JWT токена
- `GET /user` - Получение информации о текущем пользователе

### Управление викторинами (только для админов)
- `GET /Quiz` - Получить все викторины
- `GET /Quiz/:id` - Получить викторину по ID
- `POST /Quiz` - Создать новую викторину
- `PUT /Quiz/:id` - Обновить викторину
- `DELETE /Quiz/:id` - Удалить викторину

### Управление вопросами (только для админов)
- `GET /QuestionsAdmin/:id` - Получить все вопросы викторины
- `POST /QuizQuestion/:id` - Добавить вопрос к викторине
- `PUT /QuizQuestion/:qid` - Обновить вопрос
- `DELETE /QuizQuestion/:qid` - Удалить вопрос

### Управление ответами (только для админов)
- `GET /AnswersAdmin/:qid` - Получить все ответы на вопрос
- `POST /QuizAnswer/:qid` - Добавить ответ к вопросу
- `PUT /QuizAnswer/:aid` - Обновить ответ
- `DELETE /QuizAnswer/:aid` - Удалить ответ

### Опыт пользователя (только для админов)
- `POST /UserExp/:id` - Изменить количество опыта пользователя

### Прохождение викторин (для авторизованных пользователей)
- `GET /QuizQustionsForUser/:id` - Получить ID всех вопросов викторины
- `GET /QuizQustionForUser/:qid` - Получить вопрос и варианты ответов
- `POST /QuizAnswerForUser/:aid` - Отправить ответ на вопрос

## Установка

1. Клонируйте репозиторий
2. Установите зависимости:
   ```bash
   npm install express sqlite3 jsonwebtoken
   ```
3. Создайте файл базы данных SQLite `db.db` с необходимыми таблицами:
   - `user` (id, login, password, exp, role)
   - `Quiz` (Id, Text, Description)
   - `Questions` (id, qid, question, type)
   - `Answers` (qid, aid, text, explanation, true, image)

4. Запустите сервер:
   ```bash
   node server.js
   ```

## Конфигурация

- Порт сервера настраивается через переменную окружения `PORT` (по умолчанию: 3000)
- Секретный ключ JWT задается в переменной `tokenKey`
- Файл базы данных: `./db.db`
