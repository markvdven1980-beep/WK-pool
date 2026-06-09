import '../src/loadEnv';
import { PrismaClient } from '@prisma/client';
import { generatePassword, hashPassword } from '../src/services/password';

const prisma = new PrismaClient();

// Alle tijden zijn UTC. Omrekening vanuit officiële ET-tijden (EDT = UTC-4).
// CEST = UTC+2, dus tel 2 uur op bij UTC voor de Nederlandse weergave.
const matches = [
  // === GROEP A: Mexico, Zuid-Afrika, Zuid-Korea, Tsjechië ===
  { matchNum: 1,  homeTeam: 'Mexico',       awayTeam: 'Zuid-Afrika', matchDate: '2026-06-11T19:00:00Z', stadium: 'Estadio Azteca',     city: 'Mexico-Stad',  round: 'Groepsfase', group: 'A' }, // 3 PM ET = 21:00 CEST
  { matchNum: 2,  homeTeam: 'Zuid-Korea',   awayTeam: 'Tsjechië',    matchDate: '2026-06-12T02:00:00Z', stadium: 'Estadio Akron',      city: 'Guadalajara',  round: 'Groepsfase', group: 'A' }, // 10 PM ET = 04:00 CEST
  { matchNum: 3,  homeTeam: 'Tsjechië',     awayTeam: 'Zuid-Afrika', matchDate: '2026-06-18T16:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',   round: 'Groepsfase', group: 'A' }, // 12 PM ET = 18:00 CEST
  { matchNum: 4,  homeTeam: 'Mexico',       awayTeam: 'Zuid-Korea',  matchDate: '2026-06-19T01:00:00Z', stadium: 'Estadio Akron',      city: 'Guadalajara',  round: 'Groepsfase', group: 'A' }, // 9 PM ET = 03:00 CEST
  { matchNum: 5,  homeTeam: 'Tsjechië',     awayTeam: 'Mexico',      matchDate: '2026-06-25T01:00:00Z', stadium: 'Estadio Azteca',     city: 'Mexico-Stad',  round: 'Groepsfase', group: 'A' }, // 9 PM ET = 03:00 CEST
  { matchNum: 6,  homeTeam: 'Zuid-Afrika',  awayTeam: 'Zuid-Korea',  matchDate: '2026-06-25T01:00:00Z', stadium: 'Estadio BBVA',       city: 'Monterrey',    round: 'Groepsfase', group: 'A' }, // 9 PM ET = 03:00 CEST

  // === GROEP B: Canada, Bosnië-Herzegovina, Qatar, Zwitserland ===
  { matchNum: 7,  homeTeam: 'Canada',              awayTeam: 'Bosnië-Herzegovina', matchDate: '2026-06-12T19:00:00Z', stadium: 'BMO Field',        city: 'Toronto',       round: 'Groepsfase', group: 'B' }, // 3 PM ET = 21:00 CEST
  { matchNum: 8,  homeTeam: 'Qatar',               awayTeam: 'Zwitserland',        matchDate: '2026-06-13T19:00:00Z', stadium: "Levi's Stadium",   city: 'San Francisco', round: 'Groepsfase', group: 'B' }, // 3 PM ET = 21:00 CEST
  { matchNum: 9,  homeTeam: 'Zwitserland',         awayTeam: 'Bosnië-Herzegovina', matchDate: '2026-06-18T19:00:00Z', stadium: 'SoFi Stadium',     city: 'Los Angeles',   round: 'Groepsfase', group: 'B' }, // 3 PM ET = 21:00 CEST
  { matchNum: 10, homeTeam: 'Canada',              awayTeam: 'Qatar',              matchDate: '2026-06-18T22:00:00Z', stadium: 'BC Place',         city: 'Vancouver',     round: 'Groepsfase', group: 'B' }, // 6 PM ET = 00:00 CEST
  { matchNum: 11, homeTeam: 'Zwitserland',         awayTeam: 'Canada',             matchDate: '2026-06-24T19:00:00Z', stadium: 'BC Place',         city: 'Vancouver',     round: 'Groepsfase', group: 'B' }, // 3 PM ET = 21:00 CEST
  { matchNum: 12, homeTeam: 'Bosnië-Herzegovina',  awayTeam: 'Qatar',              matchDate: '2026-06-24T19:00:00Z', stadium: 'Lumen Field',      city: 'Seattle',       round: 'Groepsfase', group: 'B' }, // 3 PM ET = 21:00 CEST

  // === GROEP C: Brazilië, Marokko, Haïti, Schotland ===
  { matchNum: 13, homeTeam: 'Brazilië', awayTeam: 'Marokko',  matchDate: '2026-06-13T22:00:00Z', stadium: 'MetLife Stadium',    city: 'New Jersey',    round: 'Groepsfase', group: 'C' }, // 6 PM ET = 00:00 CEST
  { matchNum: 14, homeTeam: 'Haïti',   awayTeam: 'Schotland', matchDate: '2026-06-14T01:00:00Z', stadium: 'Gillette Stadium',   city: 'Boston',        round: 'Groepsfase', group: 'C' }, // 9 PM ET = 03:00 CEST
  { matchNum: 15, homeTeam: 'Schotland',awayTeam: 'Marokko',  matchDate: '2026-06-19T22:00:00Z', stadium: 'Gillette Stadium',   city: 'Boston',        round: 'Groepsfase', group: 'C' }, // 6 PM ET = 00:00 CEST
  { matchNum: 16, homeTeam: 'Brazilië', awayTeam: 'Haïti',    matchDate: '2026-06-20T01:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'C' }, // 9 PM ET = 03:00 CEST
  { matchNum: 17, homeTeam: 'Schotland',awayTeam: 'Brazilië', matchDate: '2026-06-24T22:00:00Z', stadium: 'Hard Rock Stadium',  city: 'Miami',         round: 'Groepsfase', group: 'C' }, // 6 PM ET = 00:00 CEST
  { matchNum: 18, homeTeam: 'Marokko',  awayTeam: 'Haïti',    matchDate: '2026-06-24T22:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',    round: 'Groepsfase', group: 'C' }, // 6 PM ET = 00:00 CEST

  // === GROEP D: Verenigde Staten, Paraguay, Australië, Turkije ===
  { matchNum: 19, homeTeam: 'Verenigde Staten', awayTeam: 'Paraguay',   matchDate: '2026-06-13T01:00:00Z', stadium: 'SoFi Stadium',        city: 'Los Angeles', round: 'Groepsfase', group: 'D' }, // 9 PM ET = 03:00 CEST
  { matchNum: 20, homeTeam: 'Australië',        awayTeam: 'Turkije',    matchDate: '2026-06-14T04:00:00Z', stadium: 'BC Place',            city: 'Vancouver',   round: 'Groepsfase', group: 'D' }, // 12 AM ET = 06:00 CEST
  { matchNum: 21, homeTeam: 'Verenigde Staten', awayTeam: 'Australië',  matchDate: '2026-06-19T19:00:00Z', stadium: 'Lumen Field',         city: 'Seattle',     round: 'Groepsfase', group: 'D' }, // 3 PM ET = 21:00 CEST
  { matchNum: 22, homeTeam: 'Turkije',          awayTeam: 'Paraguay',   matchDate: '2026-06-20T04:00:00Z', stadium: "Levi's Stadium",      city: 'San Francisco', round: 'Groepsfase', group: 'D' }, // 12 AM ET = 06:00 CEST
  { matchNum: 23, homeTeam: 'Turkije',          awayTeam: 'Verenigde Staten', matchDate: '2026-06-26T02:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Groepsfase', group: 'D' }, // 10 PM ET = 04:00 CEST
  { matchNum: 24, homeTeam: 'Paraguay',         awayTeam: 'Australië',  matchDate: '2026-06-26T02:00:00Z', stadium: "Levi's Stadium",      city: 'San Francisco', round: 'Groepsfase', group: 'D' }, // 10 PM ET = 04:00 CEST

  // === GROEP E: Duitsland, Ivoorkust, Ecuador, Curaçao ===
  { matchNum: 25, homeTeam: 'Duitsland',  awayTeam: 'Curaçao',   matchDate: '2026-06-14T17:00:00Z', stadium: 'NRG Stadium',             city: 'Houston',      round: 'Groepsfase', group: 'E' }, // 1 PM ET = 19:00 CEST
  { matchNum: 26, homeTeam: 'Ivoorkust',  awayTeam: 'Ecuador',   matchDate: '2026-06-14T23:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'E' }, // 7 PM ET = 01:00 CEST
  { matchNum: 27, homeTeam: 'Duitsland',  awayTeam: 'Ivoorkust', matchDate: '2026-06-20T20:00:00Z', stadium: 'BMO Field',               city: 'Toronto',      round: 'Groepsfase', group: 'E' }, // 4 PM ET = 22:00 CEST
  { matchNum: 28, homeTeam: 'Ecuador',    awayTeam: 'Curaçao',   matchDate: '2026-06-21T00:00:00Z', stadium: 'Arrowhead Stadium',       city: 'Kansas City',  round: 'Groepsfase', group: 'E' }, // 8 PM ET = 02:00 CEST
  { matchNum: 29, homeTeam: 'Ecuador',    awayTeam: 'Duitsland', matchDate: '2026-06-25T20:00:00Z', stadium: 'MetLife Stadium',         city: 'New Jersey',   round: 'Groepsfase', group: 'E' }, // 4 PM ET = 22:00 CEST
  { matchNum: 30, homeTeam: 'Curaçao',    awayTeam: 'Ivoorkust', matchDate: '2026-06-25T20:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'E' }, // 4 PM ET = 22:00 CEST

  // === GROEP F: Nederland, Japan, Zweden, Tunesië ===
  { matchNum: 31, homeTeam: 'Nederland', awayTeam: 'Japan',    matchDate: '2026-06-14T20:00:00Z', stadium: 'AT&T Stadium',      city: 'Dallas',       round: 'Groepsfase', group: 'F' }, // 4 PM ET = 22:00 CEST ✓
  { matchNum: 32, homeTeam: 'Zweden',    awayTeam: 'Tunesië',  matchDate: '2026-06-15T02:00:00Z', stadium: 'Estadio BBVA',      city: 'Monterrey',    round: 'Groepsfase', group: 'F' }, // 10 PM ET = 04:00 CEST
  { matchNum: 33, homeTeam: 'Nederland', awayTeam: 'Zweden',   matchDate: '2026-06-20T17:00:00Z', stadium: 'NRG Stadium',       city: 'Houston',      round: 'Groepsfase', group: 'F' }, // 1 PM ET = 19:00 CEST
  { matchNum: 34, homeTeam: 'Tunesië',   awayTeam: 'Japan',    matchDate: '2026-06-21T04:00:00Z', stadium: 'Estadio BBVA',      city: 'Monterrey',    round: 'Groepsfase', group: 'F' }, // 12 AM ET = 06:00 CEST
  { matchNum: 35, homeTeam: 'Japan',     awayTeam: 'Zweden',   matchDate: '2026-06-25T23:00:00Z', stadium: 'AT&T Stadium',      city: 'Dallas',       round: 'Groepsfase', group: 'F' }, // 7 PM ET = 01:00 CEST
  { matchNum: 36, homeTeam: 'Tunesië',   awayTeam: 'Nederland',matchDate: '2026-06-25T23:00:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City',  round: 'Groepsfase', group: 'F' }, // 7 PM ET = 01:00 CEST

  // === GROEP G: België, Egypte, Iran, Nieuw-Zeeland ===
  { matchNum: 37, homeTeam: 'België',       awayTeam: 'Egypte',      matchDate: '2026-06-15T19:00:00Z', stadium: 'Lumen Field',      city: 'Seattle',     round: 'Groepsfase', group: 'G' }, // 3 PM ET = 21:00 CEST
  { matchNum: 38, homeTeam: 'Iran',         awayTeam: 'Nieuw-Zeeland',matchDate: '2026-06-16T01:00:00Z', stadium: 'SoFi Stadium',    city: 'Los Angeles', round: 'Groepsfase', group: 'G' }, // 9 PM ET = 03:00 CEST
  { matchNum: 39, homeTeam: 'België',       awayTeam: 'Iran',        matchDate: '2026-06-21T19:00:00Z', stadium: 'SoFi Stadium',     city: 'Los Angeles', round: 'Groepsfase', group: 'G' }, // 3 PM ET = 21:00 CEST
  { matchNum: 40, homeTeam: 'Nieuw-Zeeland',awayTeam: 'Egypte',      matchDate: '2026-06-22T01:00:00Z', stadium: 'BC Place',         city: 'Vancouver',   round: 'Groepsfase', group: 'G' }, // 9 PM ET = 03:00 CEST
  { matchNum: 41, homeTeam: 'Egypte',       awayTeam: 'Iran',        matchDate: '2026-06-27T03:00:00Z', stadium: 'Lumen Field',      city: 'Seattle',     round: 'Groepsfase', group: 'G' }, // 11 PM ET = 05:00 CEST
  { matchNum: 42, homeTeam: 'Nieuw-Zeeland',awayTeam: 'België',      matchDate: '2026-06-27T03:00:00Z', stadium: 'BC Place',         city: 'Vancouver',   round: 'Groepsfase', group: 'G' }, // 11 PM ET = 05:00 CEST

  // === GROEP H: Spanje, Kaapverdië, Saudi-Arabië, Uruguay ===
  { matchNum: 43, homeTeam: 'Spanje',      awayTeam: 'Kaapverdië',  matchDate: '2026-06-15T16:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'H' }, // 12 PM ET = 18:00 CEST
  { matchNum: 44, homeTeam: 'Saudi-Arabië',awayTeam: 'Uruguay',     matchDate: '2026-06-15T22:00:00Z', stadium: 'Hard Rock Stadium',     city: 'Miami',   round: 'Groepsfase', group: 'H' }, // 6 PM ET = 00:00 CEST
  { matchNum: 45, homeTeam: 'Spanje',      awayTeam: 'Saudi-Arabië',matchDate: '2026-06-21T16:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'H' }, // 12 PM ET = 18:00 CEST
  { matchNum: 46, homeTeam: 'Uruguay',     awayTeam: 'Kaapverdië',  matchDate: '2026-06-21T22:00:00Z', stadium: 'Hard Rock Stadium',     city: 'Miami',   round: 'Groepsfase', group: 'H' }, // 6 PM ET = 00:00 CEST
  { matchNum: 47, homeTeam: 'Kaapverdië',  awayTeam: 'Saudi-Arabië',matchDate: '2026-06-27T00:00:00Z', stadium: 'NRG Stadium',           city: 'Houston', round: 'Groepsfase', group: 'H' }, // 8 PM ET = 02:00 CEST
  { matchNum: 48, homeTeam: 'Uruguay',     awayTeam: 'Spanje',      matchDate: '2026-06-27T00:00:00Z', stadium: 'Estadio Akron',         city: 'Guadalajara', round: 'Groepsfase', group: 'H' }, // 8 PM ET = 02:00 CEST

  // === GROEP I: Frankrijk, Senegal, Irak, Noorwegen ===
  { matchNum: 49, homeTeam: 'Frankrijk', awayTeam: 'Senegal',  matchDate: '2026-06-16T19:00:00Z', stadium: 'MetLife Stadium',  city: 'New Jersey', round: 'Groepsfase', group: 'I' }, // 3 PM ET = 21:00 CEST
  { matchNum: 50, homeTeam: 'Irak',      awayTeam: 'Noorwegen', matchDate: '2026-06-16T22:00:00Z', stadium: 'Gillette Stadium', city: 'Boston',     round: 'Groepsfase', group: 'I' }, // 6 PM ET = 00:00 CEST
  { matchNum: 51, homeTeam: 'Frankrijk', awayTeam: 'Irak',     matchDate: '2026-06-22T21:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'I' }, // 5 PM ET = 23:00 CEST
  { matchNum: 52, homeTeam: 'Noorwegen', awayTeam: 'Senegal',  matchDate: '2026-06-23T00:00:00Z', stadium: 'MetLife Stadium',  city: 'New Jersey', round: 'Groepsfase', group: 'I' }, // 8 PM ET = 02:00 CEST
  { matchNum: 53, homeTeam: 'Noorwegen', awayTeam: 'Frankrijk',matchDate: '2026-06-26T19:00:00Z', stadium: 'Gillette Stadium', city: 'Boston',     round: 'Groepsfase', group: 'I' }, // 3 PM ET = 21:00 CEST
  { matchNum: 54, homeTeam: 'Senegal',   awayTeam: 'Irak',     matchDate: '2026-06-26T19:00:00Z', stadium: 'BMO Field',        city: 'Toronto',    round: 'Groepsfase', group: 'I' }, // 3 PM ET = 21:00 CEST

  // === GROEP J: Argentinië, Algerije, Oostenrijk, Jordanië ===
  { matchNum: 55, homeTeam: 'Argentinië', awayTeam: 'Algerije',  matchDate: '2026-06-17T01:00:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City',   round: 'Groepsfase', group: 'J' }, // 9 PM ET = 03:00 CEST
  { matchNum: 56, homeTeam: 'Oostenrijk', awayTeam: 'Jordanië',  matchDate: '2026-06-17T04:00:00Z', stadium: "Levi's Stadium",    city: 'San Francisco', round: 'Groepsfase', group: 'J' }, // 12 AM ET = 06:00 CEST
  { matchNum: 57, homeTeam: 'Argentinië', awayTeam: 'Oostenrijk',matchDate: '2026-06-22T17:00:00Z', stadium: 'AT&T Stadium',      city: 'Dallas',        round: 'Groepsfase', group: 'J' }, // 1 PM ET = 19:00 CEST
  { matchNum: 58, homeTeam: 'Jordanië',   awayTeam: 'Algerije',  matchDate: '2026-06-23T03:00:00Z', stadium: "Levi's Stadium",    city: 'San Francisco', round: 'Groepsfase', group: 'J' }, // 11 PM ET = 05:00 CEST
  { matchNum: 59, homeTeam: 'Algerije',   awayTeam: 'Oostenrijk',matchDate: '2026-06-28T02:00:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City',   round: 'Groepsfase', group: 'J' }, // 10 PM ET = 04:00 CEST
  { matchNum: 60, homeTeam: 'Jordanië',   awayTeam: 'Argentinië',matchDate: '2026-06-28T02:00:00Z', stadium: 'AT&T Stadium',      city: 'Dallas',        round: 'Groepsfase', group: 'J' }, // 10 PM ET = 04:00 CEST

  // === GROEP K: Portugal, DR Congo, Oezbekistan, Colombia ===
  { matchNum: 61, homeTeam: 'Portugal',    awayTeam: 'DR Congo',    matchDate: '2026-06-17T17:00:00Z', stadium: 'NRG Stadium',    city: 'Houston',      round: 'Groepsfase', group: 'K' }, // 1 PM ET = 19:00 CEST
  { matchNum: 62, homeTeam: 'Oezbekistan', awayTeam: 'Colombia',    matchDate: '2026-06-18T02:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico-Stad',  round: 'Groepsfase', group: 'K' }, // 10 PM ET = 04:00 CEST
  { matchNum: 63, homeTeam: 'Portugal',    awayTeam: 'Oezbekistan', matchDate: '2026-06-23T17:00:00Z', stadium: 'NRG Stadium',    city: 'Houston',      round: 'Groepsfase', group: 'K' }, // 1 PM ET = 19:00 CEST
  { matchNum: 64, homeTeam: 'Colombia',    awayTeam: 'DR Congo',    matchDate: '2026-06-24T02:00:00Z', stadium: 'Estadio Akron',  city: 'Guadalajara',  round: 'Groepsfase', group: 'K' }, // 10 PM ET = 04:00 CEST
  { matchNum: 65, homeTeam: 'Colombia',    awayTeam: 'Portugal',    matchDate: '2026-06-27T23:30:00Z', stadium: 'Hard Rock Stadium', city: 'Miami',     round: 'Groepsfase', group: 'K' }, // 7:30 PM ET = 01:30 CEST
  { matchNum: 66, homeTeam: 'DR Congo',    awayTeam: 'Oezbekistan', matchDate: '2026-06-27T23:30:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'K' }, // 7:30 PM ET = 01:30 CEST

  // === GROEP L: Engeland, Kroatië, Ghana, Panama ===
  { matchNum: 67, homeTeam: 'Engeland', awayTeam: 'Kroatië', matchDate: '2026-06-17T20:00:00Z', stadium: 'AT&T Stadium',        city: 'Dallas',      round: 'Groepsfase', group: 'L' }, // 4 PM ET = 22:00 CEST
  { matchNum: 68, homeTeam: 'Ghana',    awayTeam: 'Panama',  matchDate: '2026-06-17T23:00:00Z', stadium: 'BMO Field',           city: 'Toronto',     round: 'Groepsfase', group: 'L' }, // 7 PM ET = 01:00 CEST
  { matchNum: 69, homeTeam: 'Engeland', awayTeam: 'Ghana',   matchDate: '2026-06-23T20:00:00Z', stadium: 'Gillette Stadium',    city: 'Boston',      round: 'Groepsfase', group: 'L' }, // 4 PM ET = 22:00 CEST
  { matchNum: 70, homeTeam: 'Panama',   awayTeam: 'Kroatië', matchDate: '2026-06-23T23:00:00Z', stadium: 'BMO Field',           city: 'Toronto',     round: 'Groepsfase', group: 'L' }, // 7 PM ET = 01:00 CEST
  { matchNum: 71, homeTeam: 'Panama',   awayTeam: 'Engeland',matchDate: '2026-06-27T21:00:00Z', stadium: 'MetLife Stadium',     city: 'New Jersey',  round: 'Groepsfase', group: 'L' }, // 5 PM ET = 23:00 CEST
  { matchNum: 72, homeTeam: 'Kroatië',  awayTeam: 'Ghana',   matchDate: '2026-06-27T21:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'L' }, // 5 PM ET = 23:00 CEST

  // === ZESTIENDE FINALES (16 wedstrijden) ===
  { matchNum: 73,  homeTeam: 'Winnaar A',    awayTeam: 'Nr. 2 B',      matchDate: '2026-06-28T21:00:00Z', stadium: 'MetLife Stadium',    city: 'New Jersey',   round: 'Zestiende finale', group: null },
  { matchNum: 74,  homeTeam: 'Winnaar B',    awayTeam: 'Nr. 2 A',      matchDate: '2026-06-28T18:00:00Z', stadium: 'AT&T Stadium',       city: 'Dallas',       round: 'Zestiende finale', group: null },
  { matchNum: 75,  homeTeam: 'Winnaar C',    awayTeam: 'Nr. 2 D',      matchDate: '2026-06-29T21:00:00Z', stadium: 'SoFi Stadium',       city: 'Los Angeles',  round: 'Zestiende finale', group: null },
  { matchNum: 76,  homeTeam: 'Winnaar D',    awayTeam: 'Nr. 2 C',      matchDate: '2026-06-29T18:00:00Z', stadium: 'Hard Rock Stadium',  city: 'Miami',        round: 'Zestiende finale', group: null },
  { matchNum: 77,  homeTeam: 'Winnaar E',    awayTeam: 'Nr. 2 F',      matchDate: '2026-06-30T21:00:00Z', stadium: 'NRG Stadium',        city: 'Houston',      round: 'Zestiende finale', group: null },
  { matchNum: 78,  homeTeam: 'Winnaar F',    awayTeam: 'Nr. 2 E',      matchDate: '2026-06-30T18:00:00Z', stadium: 'Gillette Stadium',   city: 'Boston',       round: 'Zestiende finale', group: null },
  { matchNum: 79,  homeTeam: 'Winnaar G',    awayTeam: 'Nr. 2 H',      matchDate: '2026-07-01T21:00:00Z', stadium: 'Lumen Field',        city: 'Seattle',      round: 'Zestiende finale', group: null },
  { matchNum: 80,  homeTeam: 'Winnaar H',    awayTeam: 'Nr. 2 G',      matchDate: '2026-07-01T18:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',  round: 'Zestiende finale', group: null },
  { matchNum: 81,  homeTeam: 'Winnaar I',    awayTeam: 'Nr. 2 J',      matchDate: '2026-07-02T21:00:00Z', stadium: 'MetLife Stadium',    city: 'New Jersey',   round: 'Zestiende finale', group: null },
  { matchNum: 82,  homeTeam: 'Winnaar J',    awayTeam: 'Nr. 2 I',      matchDate: '2026-07-02T18:00:00Z', stadium: 'AT&T Stadium',       city: 'Dallas',       round: 'Zestiende finale', group: null },
  { matchNum: 83,  homeTeam: 'Winnaar K',    awayTeam: 'Nr. 2 L',      matchDate: '2026-07-03T21:00:00Z', stadium: 'SoFi Stadium',       city: 'Los Angeles',  round: 'Zestiende finale', group: null },
  { matchNum: 84,  homeTeam: 'Winnaar L',    awayTeam: 'Nr. 2 K',      matchDate: '2026-07-03T18:00:00Z', stadium: 'Hard Rock Stadium',  city: 'Miami',        round: 'Zestiende finale', group: null },
  { matchNum: 85,  homeTeam: 'Nr. 3 Beste 1',awayTeam: 'Nr. 3 Beste 2',matchDate: '2026-07-04T21:00:00Z', stadium: 'NRG Stadium',        city: 'Houston',      round: 'Zestiende finale', group: null },
  { matchNum: 86,  homeTeam: 'Nr. 3 Beste 3',awayTeam: 'Nr. 3 Beste 4',matchDate: '2026-07-04T18:00:00Z', stadium: 'Gillette Stadium',   city: 'Boston',       round: 'Zestiende finale', group: null },
  { matchNum: 87,  homeTeam: 'Nr. 3 Beste 5',awayTeam: 'Nr. 3 Beste 6',matchDate: '2026-07-05T21:00:00Z', stadium: 'Lumen Field',        city: 'Seattle',      round: 'Zestiende finale', group: null },
  { matchNum: 88,  homeTeam: 'Nr. 3 Beste 7',awayTeam: 'Nr. 3 Beste 8',matchDate: '2026-07-05T18:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',  round: 'Zestiende finale', group: null },

  // === ACHTSTE FINALES (8 wedstrijden) ===
  { matchNum: 89, homeTeam: 'Winnaar W73', awayTeam: 'Winnaar W74', matchDate: '2026-07-06T21:00:00Z', stadium: 'MetLife Stadium',    city: 'New Jersey',  round: 'Achtste finale', group: null },
  { matchNum: 90, homeTeam: 'Winnaar W75', awayTeam: 'Winnaar W76', matchDate: '2026-07-06T18:00:00Z', stadium: 'AT&T Stadium',       city: 'Dallas',      round: 'Achtste finale', group: null },
  { matchNum: 91, homeTeam: 'Winnaar W77', awayTeam: 'Winnaar W78', matchDate: '2026-07-07T21:00:00Z', stadium: 'SoFi Stadium',       city: 'Los Angeles', round: 'Achtste finale', group: null },
  { matchNum: 92, homeTeam: 'Winnaar W79', awayTeam: 'Winnaar W80', matchDate: '2026-07-07T18:00:00Z', stadium: 'Hard Rock Stadium',  city: 'Miami',       round: 'Achtste finale', group: null },
  { matchNum: 93, homeTeam: 'Winnaar W81', awayTeam: 'Winnaar W82', matchDate: '2026-07-08T21:00:00Z', stadium: 'NRG Stadium',        city: 'Houston',     round: 'Achtste finale', group: null },
  { matchNum: 94, homeTeam: 'Winnaar W83', awayTeam: 'Winnaar W84', matchDate: '2026-07-08T18:00:00Z', stadium: 'Gillette Stadium',   city: 'Boston',      round: 'Achtste finale', group: null },
  { matchNum: 95, homeTeam: 'Winnaar W85', awayTeam: 'Winnaar W86', matchDate: '2026-07-09T21:00:00Z', stadium: 'Lumen Field',        city: 'Seattle',     round: 'Achtste finale', group: null },
  { matchNum: 96, homeTeam: 'Winnaar W87', awayTeam: 'Winnaar W88', matchDate: '2026-07-09T18:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Achtste finale', group: null },

  // === KWARTFINALES (4 wedstrijden) ===
  { matchNum: 97,  homeTeam: 'Winnaar W89', awayTeam: 'Winnaar W90', matchDate: '2026-07-11T21:00:00Z', stadium: 'MetLife Stadium',   city: 'New Jersey',  round: 'Kwartfinale', group: null },
  { matchNum: 98,  homeTeam: 'Winnaar W91', awayTeam: 'Winnaar W92', matchDate: '2026-07-11T18:00:00Z', stadium: 'AT&T Stadium',      city: 'Dallas',      round: 'Kwartfinale', group: null },
  { matchNum: 99,  homeTeam: 'Winnaar W93', awayTeam: 'Winnaar W94', matchDate: '2026-07-12T21:00:00Z', stadium: 'SoFi Stadium',      city: 'Los Angeles', round: 'Kwartfinale', group: null },
  { matchNum: 100, homeTeam: 'Winnaar W95', awayTeam: 'Winnaar W96', matchDate: '2026-07-12T18:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami',       round: 'Kwartfinale', group: null },

  // === HALVE FINALES (2 wedstrijden) ===
  { matchNum: 101, homeTeam: 'Winnaar W97', awayTeam: 'Winnaar W98',   matchDate: '2026-07-15T21:00:00Z', stadium: 'AT&T Stadium',   city: 'Dallas',      round: 'Halve finale', group: null },
  { matchNum: 102, homeTeam: 'Winnaar W99', awayTeam: 'Winnaar W100',  matchDate: '2026-07-16T21:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey',  round: 'Halve finale', group: null },

  // === TROOSTFINALE + FINALE ===
  { matchNum: 103, homeTeam: 'Verliezer HF1', awayTeam: 'Verliezer HF2', matchDate: '2026-07-18T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami',       round: 'Troostfinale', group: null },
  { matchNum: 104, homeTeam: 'Winnaar HF1',   awayTeam: 'Winnaar HF2',   matchDate: '2026-07-19T21:00:00Z', stadium: 'MetLife Stadium',   city: 'New Jersey',  round: 'Finale',       group: null },
];

async function main() {
  const existing = await prisma.match.count();
  if (existing > 0) {
    console.log(`Database bevat al ${existing} wedstrijden — seed overgeslagen.`);
    return;
  }

  console.log('Seeding database...');

  for (const match of matches) {
    await prisma.match.create({
      data: {
        matchNum: match.matchNum,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDate: new Date(match.matchDate),
        stadium: match.stadium,
        city: match.city,
        round: match.round,
        group: match.group,
      },
    });
  }

  console.log(`Seeded ${matches.length} matches`);

  // Admin upsert — aanmaken als die nog niet bestaat, anders overslaan.
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const adminPassword = generatePassword('admin');
    const adminHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        username: 'admin',
        name: 'Beheerder',
        email: 'admin@wkpoule.nl',
        avatar: '👑',
        isAdmin: true,
        passwordHash: adminHash,
      },
    });
    console.log(`Admin wachtwoord (eenmalig): ${adminPassword}`);
  } else {
    console.log('Admin gebruiker bestaat al — overgeslagen.');
  }
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
