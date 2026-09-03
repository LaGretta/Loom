# Loom — Frontend (React + TypeScript + Vite, PWA)

Повноцінний фронтенд для месенджера **Loom** у стилі Telegram, підключений до твого ASP.NET Core бекенда (JWT + SignalR). Зібраний строго за дизайн-специфікацією (моно-хром + кольорові крафтові 3D-об'єкти, 5 тем × 2 режими, живі шпалери).

> **Правила, яких дотримано:** тільки фронтенд (бекенд-код не змінювався), без git-комітів, без фейкового device-chrome (немає батареї/сигналу/статус-бару/рамки телефону) — рендериться лише власний UI застосунку.

---

## Як запустити

### Варіант 1 — Docker (усе однією командою)
З кореня репозиторію `D:\Loom`:

```bash
docker compose up --build
```

Підіймається 3 сервіси:
- **db** — Postgres 16 (хост-порт `5434` → всередині `5432`; 5434, щоб не конфліктувати з наявним `loom-postgres` на 5433)
- **api** — твій Loom.API (.NET 10), збирається з `Dockerfile.api`, слухає `8080`, проброшений на хост `5036`
- **web** — цей фронтенд (Vite build → nginx), на хості `http://localhost:3000`

**Відкрити:** http://localhost:3000
nginx усередині контейнера проксує `/api` та `/hubs` на сервіс `api` → same-origin, тому CORS не потрібен.

Створені **тільки** docker-файли: `Dockerfile.api`, `docker-compose.yml`, `.dockerignore`, `loom-web/Dockerfile`, `loom-web/nginx.conf`. Бекенд-код не змінювався.

### Варіант 2 — Dev-режим
Спочатку підійми бекенд (локально або `docker compose up db api`), потім:

```bash
cd loom-web
npm install
npm run dev
```

Відкрити http://localhost:5173. Vite проксує `/api` і `/hubs` на `http://localhost:5036` (змінюється через `VITE_DEV_API_TARGET`). CORS не потрібен.

**Env:** `VITE_API_BASE_URL` (порожній = same-origin, рекомендовано). Див. `.env.example`.

---

## Структура

```
D:\Loom\
├─ Dockerfile.api            # NEW — збірка Loom.API (.NET 10)
├─ docker-compose.yml        # NEW — db + api + web
├─ .dockerignore             # NEW
└─ loom-web\                 # NEW — увесь фронтенд
   ├─ Dockerfile / nginx.conf   # build → nginx + reverse-proxy /api,/hubs
   ├─ vite.config.ts            # PWA + dev-proxy
   ├─ public/favicon.svg
   └─ src\
      ├─ main.tsx, App.tsx
      ├─ assets\   loom-gifts.js / loom-symbols.js / loom-stickers.js (§7 verbatim) + loom.ts facade
      ├─ lib\      http.ts (silent refresh), api.ts, signalr.ts, enums.ts, types.ts, tokenStore.ts
      ├─ store\    auth, chat (messages+presence+typing), theme, mock (local-only features), toast
      ├─ theme\    tokens.css (усі теми verbatim) + global.css (keyframes §5, шпалери)
      ├─ ui\       Avatar, CraftedObject, Wallpaper, Overlay, primitives, format
      └─ screens\  Auth, ChatsPage, ConversationView, NewChatModal, ProfileHub, AccountMenu,
                   UserProfile, EditProfile, Members, Settings, Appearance, Stars, Gifts,
                   Premium, Stickers, Contacts, Calls, Calendar, Saved
```

## Екрани

**Підключені до реального API + SignalR (працюють по-справжньому):**
Реєстрація/Логін (+ silent refresh), список чатів (наживо), вікно чату (надсилання/редагування/видалення/реакції/reply/read/typing/presence, роздільники дат, media-upload), створення Direct/Group/Channel, контакти (через пошук користувачів), профіль (свій + чужий, редагування, аватар), учасники, Stars (баланс/історія/покупка), Gifts (каталог/надсилання/отримані), Налаштування + Вигляд (теми/режими/шпалери), перемикач тем.

**Побудовані як фронтенд з локальним станом (немає ендпоінтів на бекенді) — позначені `// TODO: wire to backend`:**
Календар/події, Дзвінки, Sticker-паки (керування), Premium-підписка (checkout), Gift Craft/Upgrade, Saved messages. Виглядають і працюють повноцінно, але дані в пам'яті/localStorage.

---

## ⚠️ Розбіжності з API / знайдені баги (перевірено на живому бекенді через Docker)

1. **🔴 БЛОКЕР — access token завжди порожній.**
   `Loom.Application/Service/AuthService.cs` (метод `BuildAuthResponse`, ~рядок 112):
   ```csharp
   response.RefreshToken = accessToken;   // ← БАГ: кладе access у поле refresh
   response.RefreshToken = refreshToken;  // потім перетирає
   // response.Token НІКОЛИ не присвоюється → повертається ""
   ```
   Через це `register`/`login`/`refresh` повертають `"token":""`, і жоден захищений запит не автентифікується.
   **Фікс (1 рядок на бекенді):** рядок 112 → `response.Token = accessToken;`
   *(Я не чіпав бекенд — лише діагностував. Для перевірки фронта згенерував валідний JWT ключем із appsettings — усе працює.)*

2. **Поле токена — `token`, а не `accessToken`** (як було написано в хендофі). Фронт читає `token`. ✅ враховано.

3. **Enum'и серіалізуються ЧИСЛАМИ, не рядками.** Немає `JsonStringEnumConverter`. Фронт нормалізує число-або-рядок → лейбл і надсилає числові ординали (безпечно в обох випадках). Рекомендація: додати `JsonStringEnumConverter` для чистого рядкового контракту.

4. **`/auth/refresh` і `/auth/logout` приймають СИРИЙ JSON-рядок** (`[FromBody] string`), не об'єкт. Фронт шле `JSON.stringify(token)`. ✅ враховано.

5. **CORS не налаштований.** Вирішено на фронті: dev-proxy + nginx reverse-proxy (same-origin). Якщо колись треба прямий доступ з іншого origin — додати CORS на бекенді.

6. **`ChatResponseDto.LastMessage` завжди `null`; `Title`/`AvatarUrl` для Direct-чатів `null`.** Наслідок: у списку чатів при холодному завантаженні немає прев'ю останнього повідомлення, а Direct-чат показується як "Direct chat". Фронт компенсує: ім'я/статус тягне з `/members` у вікні чату, прев'ю оновлює локально при `NewMessage`.

7. **SignalR транслює лише `NewMessage` + presence + typing.** Редагування, видалення, реакції, read-receipts НЕ розсилаються — їх бачить лише ініціатор.

---

## ЩО ТРЕБА ДОРОБИТИ НА БЕКЕНДІ

Список усього, що зараз працює на mock/локальному стані або має прогалину, з потрібними ендпоінтами/даними.

### 🔴 Критично (блокує реальну роботу)
- **Auth access token.** Виправити `AuthService.BuildAuthResponse` → `response.Token = accessToken;` (див. баг №1). Без цього фронт не може автентифікуватися взагалі.

### 🟠 Важливо (є ендпоінт, але даних бракує)
- **Прев'ю в списку чатів.** `GET /api/chats` має заповнювати `lastMessage` (senderName, content, type, sentAt) та `unreadCount`. Зараз `lastMessage:null`.
- **Назва/аватар Direct-чату.** `GET /api/chats` та `/chats/{id}` мають повертати `title`/`avatarUrl` співрозмовника для Direct (або окреме поле). Зараз `null`.
- **Real-time для не-нових-повідомлень (SignalR).** Додати broadcast подій: `MessageEdited`, `MessageDeleted`, `ReactionUpdated`, `MessageRead` у групу `chat-{id}`. Зараз розсилається лише `NewMessage`.
- **Enum-контракт.** Додати `JsonStringEnumConverter` (щоб enum'и були рядками) — тоді контракт збігатиметься з хендофом. Не обов'язково (фронт уже толерантний), але бажано.
- **Аватар профілю.** `PUT /api/users/me` приймає лише `displayName`+`bio`. Треба поле `avatarUrl` (або окремий `PUT /api/users/me/avatar`), щоб зберігати завантажений аватар. Зараз аватар — лише локальний прев'ю.
- **Тип вкладення для media-повідомлень.** Зараз URL медіа кладеться в `content`. Краще: заповнювати `attachments[]` (type/url/fileName/fileSizeBytes) на бекенді при надсиланні media-повідомлення.

### 🟡 Нові фічі (немає ендпоінтів — зараз повністю на фронті)
- **Календар / Події.** Потрібно: `GET/POST/PUT/DELETE /api/events` (id, title, notes, start, end, allDay, category, tags, reminders), плюс "share event у чат" + RSVP (Going/Maybe/Can't) зі станом, що синхронізується (SignalR). Зараз: seed у пам'яті (`store/mock.ts`).
- **Дзвінки (історія).** `GET /api/calls` (id, peer, direction incoming/outgoing/missed, video bool, at) + започаткування дзвінка. Зараз: seed у пам'яті.
- **Sticker-паки.** `GET /api/stickers/packs` (метадані паків) + керування. Зараз: два вбудовані паки (Loomi, Star Buddy) з SVG-бібліотеки.
- **Premium-підписка.** `GET /api/premium/plans`, `POST /api/premium/subscribe`, `POST /api/premium/cancel`; реальне встановлення `premiumTier`. Зараз: локальний перемикач (`localStorage`).
- **Gift Craft / Upgrade.** `POST /api/gifts/craft` (combine до 4 gift-instances → шанс за рідкістю → Legendary). Зараз: локальний прев'ю з розрахунком шансу.
- **Rich-метадані подарунків.** `GET /api/gifts/catalog` віддає лише {id, name, imageUrl, starCost}. Для рідкості/edition#/крафтового об'єкта фронт мапить назву на дизайн-каталог (`LoomGifts.CATALOG`) з fallback на `imageUrl`. Бажано додати `rarity`, `editionNumber`, `symbolId` у DTO.
- **Saved messages.** `GET/POST/DELETE /api/saved` (зберегти/показати збережені повідомлення). Зараз: порожній екран-заглушка.
- **"Buy gift to self" / inventory.** Немає окремого ендпоінта купівлі подарунка собі в колекцію — фронт використовує `gifts/send` з `receiverId = me`. Бажано окремий `POST /api/gifts/buy`.
- **Голосові повідомлення, дзвінки WebRTC, forward, pin, mute-правила, block** — UI-заготовки є (тости "coming soon"), ендпоінтів немає.

---

## Перевірено (Docker, живий бекенд)
- ✅ `docker compose up --build` піднімає db+api+web; db healthcheck → api (міграції) → web.
- ✅ nginx проксує `/api` (401 без токена) і `/hubs` (negotiate 401) — маршрутизація коректна; SPA deep-links (`/stars` тощо) віддають index.
- ✅ register/login/refresh/search/create-chat/send-message/members — усе через проксі повертає 200 і пише в Postgres.
- ✅ Автентифікований UI (з валідним JWT): 2-панельний desktop-шелл, список чатів, вікно чату з реальними повідомленнями, надсилання наживо (bubble + оновлення прев'ю в списку), емодзі UTF-8, Stars з крафтовим 3D-об'єктом, обидві теми (Mono/Dark, Steel/Light).
- ✅ SVG-бібліотеки (LoomGifts/LoomSym/LoomStk) інжектяться, крафтові об'єкти рендеряться.
- ✅ `npm run build` / `tsc -b` — без помилок.
```
