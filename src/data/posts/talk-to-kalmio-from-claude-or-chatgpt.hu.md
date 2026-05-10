## Egy keddi este Liszt Ferencen

A repülőd két órát késik. Veszel egy sört és egy sós perecet. Megnyitod Claude-ot a telefonon:

> *"A reptéren megittam egy sört és ettem egy sós perecet — írd ezeket mai uzsonnaként."*

Claude szól a Kalmiónak. A terven kívüli étkezés bekerül a dashboardodba. Holnap reggel a replan diff felajánlja, hogy a túlméretezett vacsorát csúsztasd péntekre, hogy ne lépd túl a heti kalóriakeretet.

Nem nyitottad meg a Kalmio appot. A laptopodat sem. A heti étrend mégis rendben tartódott — mert az asszisztens tudta, hogyan beszéljen a Kalmióval.

## Ami most kikerült

A Kalmio mostantól kétféleképpen tud AI asszisztensekkel beszélgetni — mindkettő él, mindkettő a tied:

- **MCP szerver** — a [Claude Desktop](https://claude.ai/download)-hoz, Cursor-hoz, és bármilyen kliens­hez, ami beszéli a [Model Context Protocol](https://modelcontextprotocol.io)-t. Elérhető a `https://api.kalmio.hu/mcp/sse` címen, OAuth 2.0 / PKCE hitelesítéssel.
- **ChatGPT Custom GPT Actions spec** — a ChatGPT Plus előfizetőknek, akik egy Custom GPT-be akarják bedrótozni a Kalmiót. A hitelesítés a Kalmio Beállí­tásai­ban generált, felhasználó-szintű API kulccsal megy.

Mindkettő ugyanazt az ötletet adja: **a Kalmio már nemcsak egy alkalmazás. Egy ige, amit bármelyik AI asszisztensben használhatsz, amivel amúgy is chatelsz.**

## Mit tud most az asszisztens

Az alap szettjében:

- Mai étkezések, prep feladatok, makrók megnézése
- Az aktív terv lekérése, vagy az összes prep feladat
- A hűtő tartalma — mennyiségek és lejáratok
- Új étrend generálása
- Tervezett étkezés megjelölése (megettem / kihagytam)
- Terven kívüli étkezés rögzítése (opcionálisan makrókkal)
- Tévedésből rögzített terven kívüli étkezés törlése

Nyolc tool MCP-n, hat ChatGPT Actions oldalán. A terven kívüli rögzítés és a törlés egyelőre csak MCP-n él — a ChatGPT action-limitek kiszorítják, de bekerülnek oda is, miután szűkítjük a specifikációt. Minden tool formája közvetlenül egy olyan igére képződik le, amit valóban kimondanál az asszisztensnek — ez az egyetlen teszt, ami számít.

## Miért ingyenes

Sokat gondolkoztunk a pricing-on, és ott landolt, hogy "mindenkinek ingyenes, sapka nélkül" — egyelőre legalábbis.

Az ok a mesterterv egyik elvére vezethető vissza: **a determinisztikus funkciók ingyenesek; az agentic funkciók, amelyek nekünk LLM-tokenbe kerülnek per használat, prémium.** Az MCP szerver nem égeti a mi tokenjeinket — a te Claude vagy ChatGPT előfizetésed fizeti az LLM-et. Mi csak az igéket exponáljuk. A per-használat költség a Kalmio számára gyakorlatilag nulla, tehát a helyes dolog ingyenessé tenni.

Ha valaha visszaélést látunk (egy elszabadult agent, ami napi 50 000 hívást ereget meg), beteszünk egy fair-use sapkát, fair use-ként megfogalmazva, soha nem kreditként. A prémium előfizetők korlátlan hozzáférést tartanak meg. Addig: hajrá.

## Hogyan állítsd be

A Kalmio Beállításaiban generálj egy API kulcsot. Másold ki egyszer — utána soha nem mutatjuk meg többé. Aztán:

- **Claude Desktop / egyéb MCP kliensek** — add hozzá az MCP konfig­hoz a `https://api.kalmio.hu/mcp/sse` címet, és OAuth-on keresztül hitelesítsd magad. A böngésző egyszer felugrasztja a Kalmio jóváhagyási oldalt, és kész.
- **ChatGPT Custom GPT** — készíts egy új Custom GPT-t, illeszd be az OpenAPI spec-et a `https://api.kalmio.hu/api/gpt-actions/openapi.yaml` címről a *Configure actions* ablakba, állítsd az authentikációt API Key-re az `X-API-Key` header névvel, illeszd be a kulcsod.

Részletes beállítási útmutatók a dokumentációban.

## Mi lesz legközelebb

A mostani tool-szet jól lefedi az MVP hurkot. A következő körben valószínűleg jön: a replan explicit kiváltása, személyes recept hozzáadása (ha az a funkció kikerül), hűtőtételek szerkesztése, étkezési preferenciák beállítása. Ha van egy ige, amit szeretnél, hogy az AI a Kalmióval tudjon beszélni, küldd az alkalmazáson belüli visszajelzési panelen. Figyelünk arra, melyik tool kerül ténylegesen használatba, és melyik nem.

Az alapgondolat kicsi, de teherviselő: bárhol, ahol már most is hangosan gondolkozol — Claude, ChatGPT, később Telegram botok és egyedi agentek — a Kalmio mostantól ott van. A konyha veled jön.
