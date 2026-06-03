import '../src/loadEnv';
import { PrismaClient } from '@prisma/client';
import { generatePassword, hashPassword } from '../src/services/password';

const prisma = new PrismaClient();

const matches = [
  // === GROEP A: Mexico, Zuid-Afrika, Zuid-Korea, Tsjechië ===
  { matchNum: 1,  homeTeam: 'Mexico',       awayTeam: 'Zuid-Afrika', matchDate: '2026-06-11T18:00:00Z', stadium: 'Estadio Azteca',     city: 'Mexico-Stad',  round: 'Groepsfase', group: 'A' },
  { matchNum: 2,  homeTeam: 'Zuid-Korea',   awayTeam: 'Tsjechië',    matchDate: '2026-06-11T21:00:00Z', stadium: 'Estadio Akron',      city: 'Guadalajara',  round: 'Groepsfase', group: 'A' },
  { matchNum: 3,  homeTeam: 'Tsjechië',     awayTeam: 'Zuid-Afrika', matchDate: '2026-06-18T15:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',   round: 'Groepsfase', group: 'A' },
  { matchNum: 4,  homeTeam: 'Mexico',       awayTeam: 'Zuid-Korea',  matchDate: '2026-06-18T21:00:00Z', stadium: 'Estadio Akron',      city: 'Guadalajara',  round: 'Groepsfase', group: 'A' },
  { matchNum: 5,  homeTeam: 'Tsjechië',     awayTeam: 'Mexico',      matchDate: '2026-06-24T21:00:00Z', stadium: 'Estadio Azteca',     city: 'Mexico-Stad',  round: 'Groepsfase', group: 'A' },
  { matchNum: 6,  homeTeam: 'Zuid-Afrika',  awayTeam: 'Zuid-Korea',  matchDate: '2026-06-24T21:00:00Z', stadium: 'Estadio BBVA',       city: 'Monterrey',    round: 'Groepsfase', group: 'A' },

  // === GROEP B: Canada, Bosnië-Herzegovina, Qatar, Zwitserland ===
  { matchNum: 7,  homeTeam: 'Canada',              awayTeam: 'Bosnië-Herzegovina', matchDate: '2026-06-12T18:00:00Z', stadium: 'BMO Field',        city: 'Toronto',       round: 'Groepsfase', group: 'B' },
  { matchNum: 8,  homeTeam: 'Qatar',               awayTeam: 'Zwitserland',        matchDate: '2026-06-13T18:00:00Z', stadium: "Levi's Stadium",   city: 'San Francisco', round: 'Groepsfase', group: 'B' },
  { matchNum: 9,  homeTeam: 'Zwitserland',         awayTeam: 'Bosnië-Herzegovina', matchDate: '2026-06-18T18:00:00Z', stadium: 'SoFi Stadium',     city: 'Los Angeles',   round: 'Groepsfase', group: 'B' },
  { matchNum: 10, homeTeam: 'Canada',              awayTeam: 'Qatar',              matchDate: '2026-06-18T21:00:00Z', stadium: 'BC Place',         city: 'Vancouver',     round: 'Groepsfase', group: 'B' },
  { matchNum: 11, homeTeam: 'Zwitserland',         awayTeam: 'Canada',             matchDate: '2026-06-24T18:00:00Z', stadium: 'BC Place',         city: 'Vancouver',     round: 'Groepsfase', group: 'B' },
  { matchNum: 12, homeTeam: 'Bosnië-Herzegovina',  awayTeam: 'Qatar',              matchDate: '2026-06-24T18:00:00Z', stadium: 'Lumen Field',      city: 'Seattle',       round: 'Groepsfase', group: 'B' },

  // === GROEP C: Brazilië, Marokko, Haïti, Schotland ===
  { matchNum: 13, homeTeam: 'Brazilië', awayTeam: 'Marokko',  matchDate: '2026-06-13T21:00:00Z', stadium: 'MetLife Stadium',    city: 'New Jersey',    round: 'Groepsfase', group: 'C' },
  { matchNum: 14, homeTeam: 'Haïti',   awayTeam: 'Schotland', matchDate: '2026-06-13T18:00:00Z', stadium: 'Gillette Stadium',   city: 'Boston',        round: 'Groepsfase', group: 'C' },
  { matchNum: 15, homeTeam: 'Schotland',awayTeam: 'Marokko',  matchDate: '2026-06-19T18:00:00Z', stadium: 'Gillette Stadium',   city: 'Boston',        round: 'Groepsfase', group: 'C' },
  { matchNum: 16, homeTeam: 'Brazilië', awayTeam: 'Haïti',    matchDate: '2026-06-19T21:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'C' },
  { matchNum: 17, homeTeam: 'Schotland',awayTeam: 'Brazilië', matchDate: '2026-06-24T21:00:00Z', stadium: 'Hard Rock Stadium',  city: 'Miami',         round: 'Groepsfase', group: 'C' },
  { matchNum: 18, homeTeam: 'Marokko',  awayTeam: 'Haïti',    matchDate: '2026-06-24T21:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',    round: 'Groepsfase', group: 'C' },

  // === GROEP D: Verenigde Staten, Paraguay, Australië, Turkije ===
  { matchNum: 19, homeTeam: 'Verenigde Staten', awayTeam: 'Paraguay',   matchDate: '2026-06-12T21:00:00Z', stadium: 'SoFi Stadium',        city: 'Los Angeles', round: 'Groepsfase', group: 'D' },
  { matchNum: 20, homeTeam: 'Australië',        awayTeam: 'Turkije',    matchDate: '2026-06-13T21:00:00Z', stadium: 'BC Place',            city: 'Vancouver',   round: 'Groepsfase', group: 'D' },
  { matchNum: 21, homeTeam: 'Verenigde Staten', awayTeam: 'Australië',  matchDate: '2026-06-19T18:00:00Z', stadium: 'Lumen Field',         city: 'Seattle',     round: 'Groepsfase', group: 'D' },
  { matchNum: 22, homeTeam: 'Turkije',          awayTeam: 'Paraguay',   matchDate: '2026-06-19T21:00:00Z', stadium: "Levi's Stadium",      city: 'San Francisco', round: 'Groepsfase', group: 'D' },
  { matchNum: 23, homeTeam: 'Turkije',          awayTeam: 'Verenigde Staten', matchDate: '2026-06-25T21:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Groepsfase', group: 'D' },
  { matchNum: 24, homeTeam: 'Paraguay',         awayTeam: 'Australië',  matchDate: '2026-06-25T21:00:00Z', stadium: "Levi's Stadium",      city: 'San Francisco', round: 'Groepsfase', group: 'D' },

  // === GROEP E: Duitsland, Ivoorkust, Ecuador, Curaçao ===
  { matchNum: 25, homeTeam: 'Duitsland',  awayTeam: 'Curaçao',   matchDate: '2026-06-14T21:00:00Z', stadium: 'NRG Stadium',             city: 'Houston',      round: 'Groepsfase', group: 'E' },
  { matchNum: 26, homeTeam: 'Ivoorkust',  awayTeam: 'Ecuador',   matchDate: '2026-06-14T18:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'E' },
  { matchNum: 27, homeTeam: 'Duitsland',  awayTeam: 'Ivoorkust', matchDate: '2026-06-20T21:00:00Z', stadium: 'BMO Field',               city: 'Toronto',      round: 'Groepsfase', group: 'E' },
  { matchNum: 28, homeTeam: 'Ecuador',    awayTeam: 'Curaçao',   matchDate: '2026-06-20T18:00:00Z', stadium: 'Arrowhead Stadium',       city: 'Kansas City',  round: 'Groepsfase', group: 'E' },
  { matchNum: 29, homeTeam: 'Ecuador',    awayTeam: 'Duitsland', matchDate: '2026-06-25T18:00:00Z', stadium: 'MetLife Stadium',         city: 'New Jersey',   round: 'Groepsfase', group: 'E' },
  { matchNum: 30, homeTeam: 'Curaçao',    awayTeam: 'Ivoorkust', matchDate: '2026-06-25T18:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'E' },

  // === GROEP F: Nederland, Japan, Zweden, Tunesië ===
  { matchNum: 31, homeTeam: 'Nederland', awayTeam: 'Japan',    matchDate: '2026-06-14T21:00:00Z', stadium: 'AT&T Stadium',   city: 'Dallas',    round: 'Groepsfase', group: 'F' },
  { matchNum: 32, homeTeam: 'Zweden',    awayTeam: 'Tunesië',  matchDate: '2026-06-14T18:00:00Z', stadium: 'Estadio BBVA',   city: 'Monterrey', round: 'Groepsfase', group: 'F' },
  { matchNum: 33, homeTeam: 'Nederland', awayTeam: 'Zweden',   matchDate: '2026-06-20T18:00:00Z', stadium: 'NRG Stadium',    city: 'Houston',   round: 'Groepsfase', group: 'F' },
  { matchNum: 34, homeTeam: 'Tunesië',   awayTeam: 'Japan',    matchDate: '2026-06-20T21:00:00Z', stadium: 'Estadio BBVA',   city: 'Monterrey', round: 'Groepsfase', group: 'F' },
  { matchNum: 35, homeTeam: 'Japan',     awayTeam: 'Zweden',   matchDate: '2026-06-25T21:00:00Z', stadium: 'AT&T Stadium',   city: 'Dallas',    round: 'Groepsfase', group: 'F' },
  { matchNum: 36, homeTeam: 'Tunesië',   awayTeam: 'Nederland',matchDate: '2026-06-25T21:00:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City', round: 'Groepsfase', group: 'F' },

  // === GROEP G: België, Egypte, Iran, Nieuw-Zeeland ===
  { matchNum: 37, homeTeam: 'België',       awayTeam: 'Egypte',      matchDate: '2026-06-15T21:00:00Z', stadium: 'Lumen Field',      city: 'Seattle',     round: 'Groepsfase', group: 'G' },
  { matchNum: 38, homeTeam: 'Iran',         awayTeam: 'Nieuw-Zeeland',matchDate: '2026-06-15T18:00:00Z', stadium: 'SoFi Stadium',    city: 'Los Angeles', round: 'Groepsfase', group: 'G' },
  { matchNum: 39, homeTeam: 'België',       awayTeam: 'Iran',        matchDate: '2026-06-21T18:00:00Z', stadium: 'SoFi Stadium',     city: 'Los Angeles', round: 'Groepsfase', group: 'G' },
  { matchNum: 40, homeTeam: 'Nieuw-Zeeland',awayTeam: 'Egypte',      matchDate: '2026-06-21T21:00:00Z', stadium: 'BC Place',         city: 'Vancouver',   round: 'Groepsfase', group: 'G' },
  { matchNum: 41, homeTeam: 'Egypte',       awayTeam: 'Iran',        matchDate: '2026-06-26T21:00:00Z', stadium: 'Lumen Field',      city: 'Seattle',     round: 'Groepsfase', group: 'G' },
  { matchNum: 42, homeTeam: 'Nieuw-Zeeland',awayTeam: 'België',      matchDate: '2026-06-26T21:00:00Z', stadium: 'BC Place',         city: 'Vancouver',   round: 'Groepsfase', group: 'G' },

  // === GROEP H: Spanje, Kaapverdië, Saudi-Arabië, Uruguay ===
  { matchNum: 43, homeTeam: 'Spanje',      awayTeam: 'Kaapverdië',  matchDate: '2026-06-15T21:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'H' },
  { matchNum: 44, homeTeam: 'Saudi-Arabië',awayTeam: 'Uruguay',     matchDate: '2026-06-15T18:00:00Z', stadium: 'Hard Rock Stadium',     city: 'Miami',   round: 'Groepsfase', group: 'H' },
  { matchNum: 45, homeTeam: 'Spanje',      awayTeam: 'Saudi-Arabië',matchDate: '2026-06-21T21:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'H' },
  { matchNum: 46, homeTeam: 'Uruguay',     awayTeam: 'Kaapverdië',  matchDate: '2026-06-21T18:00:00Z', stadium: 'Hard Rock Stadium',     city: 'Miami',   round: 'Groepsfase', group: 'H' },
  { matchNum: 47, homeTeam: 'Kaapverdië',  awayTeam: 'Saudi-Arabië',matchDate: '2026-06-26T18:00:00Z', stadium: 'NRG Stadium',           city: 'Houston', round: 'Groepsfase', group: 'H' },
  { matchNum: 48, homeTeam: 'Uruguay',     awayTeam: 'Spanje',      matchDate: '2026-06-26T18:00:00Z', stadium: 'Estadio Akron',         city: 'Guadalajara', round: 'Groepsfase', group: 'H' },

  // === GROEP I: Frankrijk, Senegal, Irak, Noorwegen ===
  { matchNum: 49, homeTeam: 'Frankrijk', awayTeam: 'Senegal',  matchDate: '2026-06-16T21:00:00Z', stadium: 'MetLife Stadium',  city: 'New Jersey', round: 'Groepsfase', group: 'I' },
  { matchNum: 50, homeTeam: 'Irak',      awayTeam: 'Noorwegen', matchDate: '2026-06-16T18:00:00Z', stadium: 'Gillette Stadium', city: 'Boston',     round: 'Groepsfase', group: 'I' },
  { matchNum: 51, homeTeam: 'Frankrijk', awayTeam: 'Irak',     matchDate: '2026-06-22T18:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'I' },
  { matchNum: 52, homeTeam: 'Noorwegen', awayTeam: 'Senegal',  matchDate: '2026-06-22T21:00:00Z', stadium: 'MetLife Stadium',  city: 'New Jersey', round: 'Groepsfase', group: 'I' },
  { matchNum: 53, homeTeam: 'Noorwegen', awayTeam: 'Frankrijk',matchDate: '2026-06-26T21:00:00Z', stadium: 'Gillette Stadium', city: 'Boston',     round: 'Groepsfase', group: 'I' },
  { matchNum: 54, homeTeam: 'Senegal',   awayTeam: 'Irak',     matchDate: '2026-06-26T21:00:00Z', stadium: 'BMO Field',        city: 'Toronto',    round: 'Groepsfase', group: 'I' },

  // === GROEP J: Argentinië, Algerije, Oostenrijk, Jordanië ===
  { matchNum: 55, homeTeam: 'Argentinië', awayTeam: 'Algerije',  matchDate: '2026-06-16T21:00:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City', round: 'Groepsfase', group: 'J' },
  { matchNum: 56, homeTeam: 'Oostenrijk', awayTeam: 'Jordanië',  matchDate: '2026-06-16T18:00:00Z', stadium: "Levi's Stadium",    city: 'San Francisco', round: 'Groepsfase', group: 'J' },
  { matchNum: 57, homeTeam: 'Argentinië', awayTeam: 'Oostenrijk',matchDate: '2026-06-22T21:00:00Z', stadium: 'AT&T Stadium',      city: 'Dallas',      round: 'Groepsfase', group: 'J' },
  { matchNum: 58, homeTeam: 'Jordanië',   awayTeam: 'Algerije',  matchDate: '2026-06-22T18:00:00Z', stadium: "Levi's Stadium",    city: 'San Francisco', round: 'Groepsfase', group: 'J' },
  { matchNum: 59, homeTeam: 'Algerije',   awayTeam: 'Oostenrijk',matchDate: '2026-06-27T21:00:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City', round: 'Groepsfase', group: 'J' },
  { matchNum: 60, homeTeam: 'Jordanië',   awayTeam: 'Argentinië',matchDate: '2026-06-27T21:00:00Z', stadium: 'AT&T Stadium',      city: 'Dallas',      round: 'Groepsfase', group: 'J' },

  // === GROEP K: Portugal, DR Congo, Oezbekistan, Colombia ===
  { matchNum: 61, homeTeam: 'Portugal',    awayTeam: 'DR Congo',    matchDate: '2026-06-17T21:00:00Z', stadium: 'NRG Stadium',    city: 'Houston',      round: 'Groepsfase', group: 'K' },
  { matchNum: 62, homeTeam: 'Oezbekistan', awayTeam: 'Colombia',    matchDate: '2026-06-17T18:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico-Stad',  round: 'Groepsfase', group: 'K' },
  { matchNum: 63, homeTeam: 'Portugal',    awayTeam: 'Oezbekistan', matchDate: '2026-06-23T21:00:00Z', stadium: 'NRG Stadium',    city: 'Houston',      round: 'Groepsfase', group: 'K' },
  { matchNum: 64, homeTeam: 'Colombia',    awayTeam: 'DR Congo',    matchDate: '2026-06-23T18:00:00Z', stadium: 'Estadio Akron',  city: 'Guadalajara',  round: 'Groepsfase', group: 'K' },
  { matchNum: 65, homeTeam: 'Colombia',    awayTeam: 'Portugal',    matchDate: '2026-06-27T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami',     round: 'Groepsfase', group: 'K' },
  { matchNum: 66, homeTeam: 'DR Congo',    awayTeam: 'Oezbekistan', matchDate: '2026-06-27T21:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'K' },

  // === GROEP L: Engeland, Kroatië, Ghana, Panama ===
  { matchNum: 67, homeTeam: 'Engeland', awayTeam: 'Kroatië', matchDate: '2026-06-17T21:00:00Z', stadium: 'AT&T Stadium',        city: 'Dallas',      round: 'Groepsfase', group: 'L' },
  { matchNum: 68, homeTeam: 'Ghana',    awayTeam: 'Panama',  matchDate: '2026-06-17T18:00:00Z', stadium: 'BMO Field',           city: 'Toronto',     round: 'Groepsfase', group: 'L' },
  { matchNum: 69, homeTeam: 'Engeland', awayTeam: 'Ghana',   matchDate: '2026-06-23T18:00:00Z', stadium: 'Gillette Stadium',    city: 'Boston',      round: 'Groepsfase', group: 'L' },
  { matchNum: 70, homeTeam: 'Panama',   awayTeam: 'Kroatië', matchDate: '2026-06-23T21:00:00Z', stadium: 'BMO Field',           city: 'Toronto',     round: 'Groepsfase', group: 'L' },
  { matchNum: 71, homeTeam: 'Panama',   awayTeam: 'Engeland',matchDate: '2026-06-27T18:00:00Z', stadium: 'MetLife Stadium',     city: 'New Jersey',  round: 'Groepsfase', group: 'L' },
  { matchNum: 72, homeTeam: 'Kroatië',  awayTeam: 'Ghana',   matchDate: '2026-06-27T18:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'L' },

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
  .finally(async () => {
    await prisma.$disconnect();
  });
