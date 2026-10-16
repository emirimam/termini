# WhatsApp šabloni (Meta Business Manager)

WhatsApp dozvoljava da firma prva pošalje poruku samo preko **odobrenog šablona**.
Potrebna su tri šablona, kategorija **Utility**, jezik **Croatian (hr)** (ili drugi –
tada promijenite `WHATSAPP_TEMPLATE_LANG`). Nazivi moraju biti tačno ovakvi
(ili promijenite odgovarajuće varijable okruženja).

Parametri u tijelu poruke su uvijek istim redom:
`{{1}}` ime klijenta · `{{2}}` naziv salona · `{{3}}` usluga · `{{4}}` dan i vrijeme
(npr. *utorak, 21. oktobra u 14:30*).

Zamijenite `https://VAŠ-DOMEN` stvarnom adresom aplikacije.

---

## 1. `termin_potvrda`

**Body**

```
Zdravo {{1}}, vaš termin u {{2}} je zakazan: {{3}}, {{4}}.
Ako trebate promijeniti ili otkazati termin, koristite dugme ispod.
```

**Buttons**

| Tip | Tekst | Vrijednost |
|---|---|---|
| Visit website (dynamic) | Upravljaj terminom | `https://VAŠ-DOMEN/t/{{1}}` |

---

## 2. `termin_podsjetnik`

**Body**

```
Zdravo {{1}}, podsjećamo vas na termin u {{2}}: {{3}}, {{4}}.
Molimo potvrdite dolazak.
```

**Buttons** (redoslijed je bitan)

| # | Tip | Tekst | Vrijednost |
|---|---|---|---|
| 0 | Quick reply | Dolazim | – |
| 1 | Quick reply | Otkaži termin | – |
| 2 | Visit website (dynamic) | Promijeni termin | `https://VAŠ-DOMEN/t/{{1}}` |

Kad klijent dodirne *Dolazim* ili *Otkaži termin*, aplikacija preko webhooka
odmah potvrdi ili otkaže termin i odgovori porukom.

---

## 3. `termin_otkazan`

**Body**

```
Zdravo {{1}}, vaš termin u {{2}} ({{3}}, {{4}}) je otkazan.
```

**Buttons**

| Tip | Tekst | Vrijednost |
|---|---|---|
| Visit website (dynamic) | Zakaži novi termin | `https://VAŠ-DOMEN/{{1}}` |

---

## Primjeri za odobrenje

Meta traži primjer vrijednosti za svaki parametar, npr.:
`Amra` · `Salon Lejla` · `Žensko šišanje` · `utorak, 21. oktobra u 14:30`,
a za dinamički link `3f6c0a2e-8a1b-4c2d-9e7f-1a2b3c4d5e6f` (ili `salon-lejla` za otkazivanje).

## Napomene

- Šablon u kategoriji Utility ne smije sadržavati promotivni tekst – inače ga Meta
  prekategoriše u Marketing (skuplje).
- Odobrenje obično traje od nekoliko minuta do 24 sata.
