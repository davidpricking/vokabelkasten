// Grammatik-Themen nach dem Bildungsplan Baden-Württemberg (Gymnasium, G9, Fassung V3.0 vom 23. März 2026).
// Der Bildungsplan nennt nur Doppelklassen (5/6, 7/8 …). Klasse 5 folgt der Reihenfolge des Lehrwerks
// Camden Town 5 (Gymnasium), Theme 1 bis 6. Die übrigen Themen von 5/6 stehen vorläufig unter Klasse 6.
// Die Zuordnung lässt sich pro Thema über "band" ändern.
//
// Aufbau eines Themas:
//   id, band (Schlüssel aus bands; ein band kann mit review: [ids] Themen zum Wiederholen zeigen), t (Titel wie im Bildungsplan), de (deutscher Untertitel),
//   rez: true = im Bildungsplan nur rezeptiv (erkennen statt selbst bilden),
//   g8: true = steht nur im Bildungsplan G8 (V2, gilt noch für die älteren Jahrgänge),
//   explain: Absätze der Erklärung (**fett** wird markiert), ex: Beispiele [Fremdsprache, Deutsch],
//   tasks: Aufgaben
//     ["gap", "Satz mit ___ (Hinweis)", "Lösung|andere Lösung", "Erklärung bei Fehlern", ["Falle", "Falle"]]  (mit Fallen: Auswahl statt Tippen)
//     ["pick", "Satz mit ___", ["richtig", "falsch", "falsch"], "Erklärung bei Fehlern"]
//     ["order", "Richtig geordneter Satz.", "Erklärung bei Fehlern"]
// Themen ohne explain stehen in der Übersicht als "kommt noch".
window.GRAMMAR = {
  Englisch: {
    source: "Bildungsplan BW, Gymnasium (G9), Englisch als erste Fremdsprache, V3.0 (2026)",
    // Grundwörter zum Antippen in Grammatik-Aufgaben, falls sie nicht in den eigenen Wortkarten stehen.
    gloss: {
      "i": "ich", "me": "mich, mir", "my": "mein", "you": "du, ihr, Sie", "your": "dein, euer", "he": "er",
      "him": "ihn, ihm", "his": "sein", "she": "sie", "her": "sie, ihr", "it": "es", "its": "sein (von Dingen)",
      "we": "wir", "us": "uns", "our": "unser", "they": "sie (Mehrzahl)", "them": "sie, ihnen", "their": "ihr (Mehrzahl)",
      "am": "bin", "is": "ist", "are": "sind, bist", "was": "war", "were": "waren, warst", "be": "sein",
      "been": "gewesen", "isn't": "ist nicht", "aren't": "sind nicht", "wasn't": "war nicht", "weren't": "waren nicht", "i'm": "ich bin",
      "you're": "du bist", "he's": "er ist", "she's": "sie ist", "it's": "es ist", "we're": "wir sind", "they're": "sie sind",
      "have": "haben", "has": "hat", "had": "hatte, hatten", "haven't": "haben nicht", "hasn't": "hat nicht", "i've": "ich habe",
      "do": "tun, machen", "does": "tut, macht", "did": "tat (Vergangenheit von do)", "don't": "nicht (mit I, you, we, they)", "doesn't": "nicht (mit he, she, it)", "didn't": "nicht (Vergangenheit)",
      "can": "können", "can't": "nicht können", "cannot": "nicht können", "will": "werden (Zukunft)", "won't": "wird nicht", "would": "würde",
      "must": "müssen", "mustn't": "nicht dürfen", "should": "sollte", "shouldn't": "sollte nicht", "going": "gehend; going to = werden (Plan)", "the": "der, die, das",
      "a": "ein, eine", "an": "ein, eine (vor Vokal)", "this": "dies, dieser hier", "that": "das, jener dort; dass", "these": "diese hier", "those": "die dort",
      "some": "einige, etwas", "any": "irgendein, kein", "much": "viel", "many": "viele", "few": "wenige", "little": "wenig, klein",
      "lots": "viele", "lot": "viel", "more": "mehr", "most": "am meisten", "and": "und", "but": "aber",
      "or": "oder", "because": "weil", "so": "also, deshalb", "if": "wenn, falls", "unless": "außer wenn", "when": "wann; wenn, als",
      "than": "als (beim Vergleich)", "in": "in", "on": "auf", "at": "an, bei, um", "under": "unter", "behind": "hinter",
      "between": "zwischen", "next": "nächste; next to = neben", "to": "zu, nach", "from": "aus, von", "with": "mit", "for": "für",
      "of": "von", "by": "mit (Verkehrsmittel), von", "into": "in … hinein", "about": "über, ungefähr", "not": "nicht", "no": "nein, kein",
      "yes": "ja", "never": "nie", "always": "immer", "often": "oft", "sometimes": "manchmal", "usually": "normalerweise",
      "already": "schon", "just": "gerade eben", "ever": "jemals", "yet": "schon; noch nicht (bei Verneinung)", "now": "jetzt", "today": "heute",
      "tomorrow": "morgen", "yesterday": "gestern", "ago": "vor (zeitlich)", "last": "letzte", "every": "jeder", "what": "was",
      "where": "wo", "who": "wer", "why": "warum", "how": "wie", "which": "welche", "whose": "wessen",
      "there": "dort; there is = es gibt", "here": "hier", "one": "eins", "two": "zwei", "three": "drei", "four": "vier",
      "five": "fünf", "six": "sechs", "seven": "sieben", "eight": "acht", "nine": "neun", "ten": "zehn",
      "went": "ging (go)", "gone": "gegangen (go)", "saw": "sah (see)", "seen": "gesehen (see)", "ate": "aß (eat)", "eaten": "gegessen (eat)",
      "bought": "kaufte, gekauft (buy)", "caught": "fing, gefangen (catch)", "rode": "ritt, fuhr (ride)", "ridden": "geritten, gefahren (ride)", "wrote": "schrieb (write)", "won": "gewann, gewonnen (win)",
      "knew": "wusste (know)", "known": "gewusst (know)", "lost": "verlor, verloren (lose)", "better": "besser", "best": "am besten", "worse": "schlechter",
      "worst": "am schlechtesten", "children": "Kinder", "child": "Kind", "women": "Frauen", "feet": "Füße", "baby": "Baby",
      "elephant": "Elefant", "germany": "Deutschland", "team": "Mannschaft", "ball": "Ball", "colour": "Farbe", "touch": "berühren",
      "toilet": "Toilette", "basketball": "Basketball", "ill": "krank", "dishes": "Geschirr", "spider": "Spinne", "milk": "Milch",
      "meat": "Fleisch", "breakfast": "Frühstück", "film": "Film", "bark": "bellen", "song": "Lied", "biscuit": "Keks",
      "fridge": "Kühlschrank", "egg": "Ei", "bread": "Brot", "pizza": "Pizza", "tea": "Tee", "vet": "Tierarzt, Tierärztin",
      "rabbit": "Kaninchen", "pair": "Paar", "feed": "füttern", "cinema": "Kino", "key": "Schlüssel", "fox": "Fuchs",
      "catch": "fangen", "sugar": "Zucker", "advice": "Rat, Ratschlag", "furniture": "Möbel", "snow": "schneien, Schnee", "anyone": "irgendjemand",
      "mountain": "Berg", "high": "hoch", "driver": "Fahrer", "slow": "langsam", "slowly": "langsam (Adverb)", "opposite": "gegenüber", "toy": "Spielzeug", "tennis": "Tennis", "fast": "schnell", "happily": "fröhlich",
      "beautifully": "wunderschön", "quietly": "leise", "carefully": "vorsichtig", "hard": "hart, fleißig", "hardly": "kaum", "cancel": "absagen",
      "apologise": "sich entschuldigen", "novel": "Roman", "heat": "erhitzen, Hitze", "melt": "schmelzen", "pass": "bestehen", "study": "lernen", "tall": "groß (Körper)",
      "travel": "reisen", "lottery": "Lotterie", "earlier": "früher", "hurt": "weh tun", "match": "Spiel", "parent": "Elternteil",
      "brother": "Bruder"
    },
    bands: [
      { id: "ct-1", group: "Klasse 5 · Camden Town", label: "Theme 1 · New in Camden" },
      { id: "ct-2", group: "Klasse 5 · Camden Town", label: "Theme 2 · At school" },
      { id: "ct-3", group: "Klasse 5 · Camden Town", label: "Theme 3 · Hobbies and activities" },
      { id: "ct-4", group: "Klasse 5 · Camden Town", label: "Theme 4 · Birthdays" },
      { id: "ct-5", group: "Klasse 5 · Camden Town", label: "Theme 5 · Pets and animals" },
      { id: "ct-6", group: "Klasse 5 · Camden Town", label: "Theme 6 · Holidays in Britain", note: "Im Buch freiwillig. Keine neue Grammatik, nur Wiederholung",
        review: ["simplepresent", "presentprog", "questions", "bequestions"] },
      { id: "6", label: "Klasse 6", note: "Bildungsplan Klassen 5/6, Reihenfolge ist ein Vorschlag" },
      { id: "7/8", label: "Klassen 7/8" },
      { id: "9/10", label: "Klassen 9/10" },
      { id: "11", label: "Klasse 11" },
      { id: "12/13", label: "Klassen 12/13" }
    ],
    topics: [
      // ---------- Klasse 5, Theme 1 ----------
      { id: "plural", band: "ct-1", t: "Singular and plural of nouns", de: "Einzahl und Mehrzahl",
        explain: [
          "Meist hängst du einfach **-s** an: book → book**s**, cat → cat**s**.",
          "Nach s, sh, ch und x kommt **-es**: bus → bus**es**, box → box**es**, watch → watch**es**.",
          "Steht vor dem y ein Konsonant, wird daraus **-ies**: baby → bab**ies**. Aber: boy → boy**s**, weil vor dem y ein Vokal steht.",
          "Einige Wörter sind unregelmäßig und du lernst sie auswendig: man → **men**, woman → **women**, child → **children**, foot → **feet**, tooth → **teeth**, mouse → **mice**, person → **people**."
        ],
        ex: [["two **books**", "zwei Bücher"], ["three **boxes**", "drei Schachteln"], ["many **children**", "viele Kinder"]],
        tasks: [
          ["gap", "one cat, two ___ (cat)", "cats", "", ["cat", "cates"]],
          ["gap", "one bus, three ___ (bus)", "buses", "Nach s kommt -es.", ["buss", "bus"]],
          ["gap", "one baby, two ___ (baby)", "babies", "Konsonant + y wird zu -ies.", ["babys", "babyes"]],
          ["gap", "one boy, two ___ (boy)", "boys", "Vor dem y steht ein Vokal (o), also nur -s.", ["boies", "boyes"]],
          ["gap", "one child, five ___ (child)", "children", "child ist unregelmäßig: children.", ["childs", "childrens"]],
          ["gap", "one box, four ___ (box)", "boxes", "Nach x kommt -es.", ["boxs", "box"]],
          ["pick", "There are two ___ at the door.", ["women", "womans", "womens"], "woman → women ist unregelmäßig."],
          ["pick", "My ___ hurt after the long walk.", ["feet", "foots", "feets"], "foot → feet ist unregelmäßig."]
        ] },
      { id: "articles", band: "ct-1", t: "Definite and indefinite article", de: "a, an und the",
        explain: [
          "**a** steht vor einem Konsonanten-**Laut**: a dog, a book, a **u**niform (gesprochen „ju“).",
          "**an** steht vor einem Vokal-**Laut**: an apple, an orange, an **h**our (das h hört man nicht).",
          "**the** heißt der, die oder das. Du nimmst es, wenn klar ist, welches Ding gemeint ist: Close **the** door, please.",
          "Bei Berufen steht im Englischen a oder an, im Deutschen nicht: She is **a** teacher. = Sie ist Lehrerin."
        ],
        ex: [["I've got **a** dog and **an** iguana.", "Ich habe einen Hund und einen Leguan."], ["**The** dog is called Max.", "Der Hund heißt Max."], ["My dad is **an** engineer.", "Mein Vater ist Ingenieur."]],
        tasks: [
          ["pick", "___ apple", ["an", "a"], "apple fängt mit einem Vokal-Laut an."],
          ["pick", "___ banana", ["a", "an"], "banana fängt mit einem Konsonanten-Laut an."],
          ["pick", "___ hour", ["an", "a"], "Das h in hour hört man nicht, man spricht „auer“."],
          ["pick", "___ uniform", ["a", "an"], "uniform spricht man „junifórm“, also mit Konsonanten-Laut."],
          ["pick", "My mum is ___ doctor.", ["a", "an", "–"], "Bei Berufen steht im Englischen a oder an."],
          ["pick", "I've got a cat and a dog. ___ cat is black.", ["The", "A", "An"], "Die Katze kennt man schon, also the."],
          ["pick", "I've got ___ idea!", ["an", "a"], "idea fängt mit einem Vokal-Laut an."],
          ["pick", "There's ___ elephant in the zoo.", ["an", "a"], "elephant fängt mit einem Vokal-Laut an."]
        ] },
      { id: "tobe", band: "ct-1", t: "Personal pronouns and to be", de: "ich, du, er … und sein",
        explain: [
          "Personalpronomen: **I, you, he, she, it, we, you, they**. I schreibst du immer groß.",
          "**he** steht für Jungen und Männer, **she** für Mädchen und Frauen, **it** für Dinge: Where's my bag? – **It** is under the desk.",
          "to be heißt sein: I **am**, you **are**, he/she/it **is**, we/you/they **are**.",
          "Kurzformen: I**'m**, you**'re**, he**'s**, it**'s**, we**'re**, they**'re**. Verneint: I**'m not**, he **isn't**, they **aren't**."
        ],
        ex: [["I**'m** eleven.", "Ich bin elf."], ["My sister **is** at school.", "Meine Schwester ist in der Schule."], ["We **aren't** hungry.", "Wir haben keinen Hunger."]],
        tasks: [
          ["gap", "I ___ from Germany. (be)", "am|'m", "Zu I gehört am.", ["is", "are"]],
          ["gap", "My brother ___ twelve. (be)", "is|'s", "my brother = he, also is.", ["are", "am"]],
          ["gap", "Tom and Lucy ___ my friends. (be)", "are|'re", "Tom and Lucy = they, also are.", ["is", "am"]],
          ["pick", "Where is my bag? – ___ is under the desk.", ["It", "He", "She"], "Für Dinge nimmst du it."],
          ["pick", "Emma is new. ___ is from Leeds.", ["She", "He", "It"], "Emma ist ein Mädchen: she."],
          ["gap", "We ___ late. (nicht sein)", "aren't|are not|'re not", "", ["isn't", "not are"]],
          ["pick", "___ am in class 5b.", ["I", "Me", "My"]],
          ["pick", "You and Ben ___ in my team.", ["are", "is", "am"], "You and Ben = ihr, also are."]
        ] },
      { id: "bequestions", band: "ct-1", t: "Questions with to be", de: "Fragen mit am, is, are",
        explain: [
          "Bei Fragen mit to be tauschen Subjekt und Verb die Plätze: You **are** hungry. → **Are you** hungry?",
          "Kurzantworten: Are you hungry? – Yes, I **am**. / No, I**'m not**. Is it red? – Yes, it **is**. / No, it **isn't**.",
          "Fragewörter stehen ganz vorn: **What** is your name? **Where** is the mouse? **How old** are you? **Who** is that? **When** is your birthday?",
          "Kurz: What's, Where's, Who's."
        ],
        ex: [["**Are** you hungry? – Yes, I **am**.", "Hast du Hunger? – Ja."], ["**How old** are you?", "Wie alt bist du?"], ["**Where's** the mouse?", "Wo ist die Maus?"]],
        tasks: [
          ["pick", "___ you twelve?", ["Are", "Is", "Am"], "Zu you gehört are."],
          ["pick", "___ your sister at home?", ["Is", "Are", "Am"], "your sister = she, also is."],
          ["pick", "Are you from London? – No, ___.", ["I'm not", "I amn't", "I not"], "Verneint: I'm not."],
          ["pick", "___ old are you? – I'm eleven.", ["How", "What", "Who"], "Wie alt = How old."],
          ["pick", "___ is your teacher? – Mr Brown.", ["Who", "Where", "How"], "Die Antwort ist eine Person: who."],
          ["gap", "___ is my pencil? – It's on the desk.", "Where", "Die Antwort ist ein Ort: where.", ["What", "Who"]],
          ["order", "Where is your school bag?"],
          ["pick", "Are your parents at work? – Yes, they ___.", ["are", "is", "am"]]
        ] },
      { id: "thereis", band: "ct-1", t: "There is / there are", de: "Es gibt …",
        explain: [
          "Mit **there is** und **there are** sagst du, was es irgendwo gibt oder was zu sehen ist.",
          "**There is** (kurz: there's) steht vor der Einzahl: There's a desk in my room.",
          "**There are** steht vor der Mehrzahl: There are two windows.",
          "Verneint: There **isn't** a TV. There **aren't** any chairs. Fragen: **Is there** a cat? **Are there** any books?"
        ],
        ex: [["**There is** a pink school bag on the desk.", "Auf dem Tisch liegt eine pinke Schultasche."], ["**There are** twenty kids in my class.", "In meiner Klasse sind zwanzig Kinder."]],
        tasks: [
          ["pick", "___ a cat in the garden.", ["There is", "There are"], "a cat ist Einzahl."],
          ["pick", "___ three books on the shelf.", ["There are", "There is"], "three books ist Mehrzahl."],
          ["gap", "There ___ a big tree in our park.", "is|'s", "", ["are", "be"]],
          ["gap", "There ___ lots of shops in Camden.", "are", "", ["is", "be"]],
          ["pick", "___ there a bathroom upstairs?", ["Is", "Are"], "a bathroom ist Einzahl."],
          ["pick", "There ___ any chairs in the room.", ["aren't", "isn't"], "chairs ist Mehrzahl."],
          ["order", "There are two beds in my room."],
          ["pick", "Are there any apples? – Yes, there ___.", ["are", "is"]]
        ] },
      { id: "prepositions", band: "ct-1", t: "Prepositions of place", de: "Wo ist etwas?",
        explain: [
          "Präpositionen sagen, wo etwas ist: **in** (in), **on** (auf), **under** (unter), **next to** (neben), **behind** (hinter), **in front of** (vor), **between** (zwischen).",
          "Was an der Wand hängt, ist **on** the wall.",
          "Nach der Präposition kommt meist the oder my: under **the** bed, next to **my** bag."
        ],
        ex: [["The phone is **under** the bed.", "Das Handy liegt unter dem Bett."], ["The cat is **between** the chairs.", "Die Katze ist zwischen den Stühlen."], ["The poster is **on** the wall.", "Das Poster hängt an der Wand."]],
        tasks: [
          ["pick", "The book is ___ the desk. (auf)", ["on", "in", "under"]],
          ["pick", "The ball is ___ the bed. (unter)", ["under", "behind", "on"]],
          ["pick", "My bag is ___ the chair. (neben)", ["next to", "between", "in front of"]],
          ["pick", "The dog is ___ the door. (hinter)", ["behind", "in front of", "under"]],
          ["gap", "The pens are ___ the pencil case. (in)", "in", "", ["on", "at"]],
          ["gap", "Emma is sitting ___ Tom and Ben. (zwischen)", "between", "", ["next", "behind"]],
          ["pick", "The bus stop is ___ the school. (vor)", ["in front of", "before", "behind"], "vor einem Ort = in front of."],
          ["pick", "There's a poster ___ the wall. (an)", ["on", "at", "in"], "an der Wand = on the wall."]
        ] },
      { id: "possessives", band: "ct-1", t: "Possessive determiners", de: "mein, dein, sein …",
        explain: [
          "Possessivbegleiter sagen, wem etwas gehört: I → **my**, you → **your**, he → **his**, she → **her**, it → **its**, we → **our**, you → **your**, they → **their**.",
          "**his** gehört zu einem Jungen oder Mann, **her** zu einem Mädchen oder einer Frau.",
          "Achtung: **its** (bei Dingen und Tieren) hat keinen Apostroph. **it's** heißt it is.",
          "Die Form bleibt gleich, auch vor der Mehrzahl: my dog, my dogs."
        ],
        ex: [["This is **my** brother. **His** name is Ben.", "Das ist mein Bruder. Er heißt Ben."], ["**Our** school is big.", "Unsere Schule ist groß."], ["The bird is in **its** cage.", "Der Vogel ist in seinem Käfig."]],
        tasks: [
          ["pick", "Lisa has got a cat. ___ cat is black.", ["Her", "His", "Their"], "Lisa ist ein Mädchen: her."],
          ["pick", "Tom is in class 5a. ___ teacher is Mrs Lee.", ["His", "Her", "Its"], "Tom ist ein Junge: his."],
          ["gap", "We live in Camden. ___ house is green. (wir)", "Our", "", ["We", "Us"]],
          ["gap", "I love ___ dog. (ich)", "my", "", ["me", "I"]],
          ["pick", "My parents are nice. ___ car is old.", ["Their", "There", "They're"], "their = ihr (Mehrzahl). there = dort."],
          ["pick", "The bird is in ___ cage.", ["its", "it's", "his"], "its ohne Apostroph."],
          ["gap", "Is this ___ pen? (du)", "your", "", ["you", "yours"]],
          ["pick", "Max and I are friends. ___ favourite colour is blue.", ["Our", "Their", "My"], "Max and I = wir, also our."]
        ] },
      // ---------- Klasse 5, Theme 2 ----------
      { id: "commands", band: "ct-2", t: "Commands and requests", de: "Aufforderungen und Bitten",
        explain: [
          "Eine Aufforderung beginnt mit dem **Verb in der Grundform**, ohne you: **Open** your books! **Listen**!",
          "Verneint sagst du **Don't**: **Don't** run! **Don't** be late!",
          "Mit **please** wird es eine höfliche Bitte: **Please** sit down. / Sit down, **please**.",
          "Einen Vorschlag machst du mit **Let's**: **Let's** go to the park!"
        ],
        ex: [["**Close** the door, please.", "Mach bitte die Tür zu."], ["**Don't** touch that!", "Fass das nicht an!"], ["**Let's** play a game!", "Lass uns ein Spiel spielen!"]],
        tasks: [
          ["pick", "___ the window, please.", ["Open", "Opens", "You open"], "Aufforderungen beginnen mit der Grundform."],
          ["pick", "___ talk in the library!", ["Don't", "Not", "Doesn't"], "Verneint: Don't + Verb."],
          ["gap", "___ late! (nicht + sein)", "Don't be|Do not be", "", ["Not be", "Don't"]],
          ["order", "Please close the door."],
          ["pick", "___ play a game!", ["Let's", "Lets us", "Let"], "Vorschläge mit Let's."],
          ["gap", "___ quiet, please! (sein)", "Be", "Grundform von sein: be.", ["Are", "Is"]],
          ["order", "Don't touch the cake."],
          ["pick", "Sit down, ___.", ["please", "thanks", "sorry"], "Bitten mit please."]
        ] },
      { id: "can", band: "ct-2", t: "can / can't", de: "können und dürfen",
        explain: [
          "Mit **can** sagst du, was jemand kann oder darf: I **can** swim. **Can** I go to the toilet?",
          "can bleibt bei allen Personen gleich, auch bei he, she, it ohne -s: She **can** sing.",
          "Danach kommt das Verb in der Grundform ohne to: I can **play**.",
          "Verneint: **can't** (cannot). Fragen: **Can** you swim? – Yes, I **can**. / No, I **can't**."
        ],
        ex: [["I **can** play the piano.", "Ich kann Klavier spielen."], ["Dogs **can't** climb trees.", "Hunde können nicht auf Bäume klettern."], ["**Can** I open the window?", "Darf ich das Fenster öffnen?"]],
        tasks: [
          ["pick", "My sister ___ swim very well.", ["can", "cans", "can to"], "can bleibt immer gleich."],
          ["pick", "Can you ___ the guitar?", ["play", "plays", "to play"], "Nach can steht die Grundform."],
          ["gap", "Fish ___ walk. (nicht können)", "can't|cannot", "", ["don't can", "can"]],
          ["pick", "___ I go to the toilet, please?", ["Can", "Do", "Am"], "Darf ich … ? = Can I … ?"],
          ["gap", "Can your dad cook? – Yes, he ___.", "can", "", ["does", "is"]],
          ["gap", "Can Emma ride a horse? – No, she ___.", "can't|cannot", "", ["doesn't", "isn't"]],
          ["order", "Can you play basketball?"],
          ["pick", "Tom ___ come to the party. He's ill.", ["can't", "doesn't can", "not can"], "Verneint: can't, ohne do."]
        ] },
      { id: "havegot", band: "ct-2", t: "have got / has got", de: "haben, besitzen",
        explain: [
          "Mit **have got** sagst du, was jemand hat: I**'ve got** a dog. We**'ve got** maths today.",
          "Bei he, she, it heißt es **has got**: She**'s got** a new bike. Achtung: he's got = he has got.",
          "Verneint: I **haven't got** … / She **hasn't got** …",
          "Fragen: **Have** you **got** a pet? – Yes, I **have**. / No, I **haven't**. **Has** Gillian **got** art today? – No, she **hasn't**."
        ],
        ex: [["I **have got** two brothers.", "Ich habe zwei Brüder."], ["Julia **hasn't got** history today.", "Julia hat heute keinen Geschichtsunterricht."], ["**Has** Tom **got** a pet?", "Hat Tom ein Haustier?"]],
        tasks: [
          ["gap", "I ___ got a sister. (have)", "have|'ve", "", ["has", "am"]],
          ["gap", "Ben ___ got a new phone. (have)", "has|'s", "Ben = he, also has.", ["have", "is"]],
          ["pick", "We ___ got maths on Monday.", ["have", "has"]],
          ["gap", "My parents ___ got a car. (nicht haben)", "haven't|have not", "", ["hasn't", "don't"]],
          ["pick", "___ you got a pet?", ["Have", "Has", "Do"]],
          ["pick", "Has Lucy got a dog? – No, she ___.", ["hasn't", "haven't", "isn't"]],
          ["order", "Have you got a pencil?"],
          ["pick", "My cat ___ got green eyes.", ["has", "have"], "my cat = it, also has."]
        ] },
      { id: "genitive", band: "ct-2", t: "Genitive", de: "Wem gehört was?",
        explain: [
          "Wem etwas gehört, zeigst du mit **'s**: Tom**'s** bike = das Fahrrad von Tom.",
          "Endet die Mehrzahl auf -s, hängst du nur den Apostroph an: my parent**s'** car = das Auto meiner Eltern.",
          "Bei unregelmäßiger Mehrzahl ohne -s nimmst du wieder **'s**: the children**'s** room.",
          "Bei Dingen nimmst du meist **of**: the end **of** the film."
        ],
        ex: [["This is **Emma's** pen.", "Das ist Emmas Stift."], ["My **grandparents'** house is big.", "Das Haus meiner Großeltern ist groß."], ["the end **of** the story", "das Ende der Geschichte"]],
        tasks: [
          ["gap", "This is the bike of Tom. → This is ___ bike.", "Tom's", "", ["Toms", "Tom"]],
          ["gap", "the dog of my sister → my ___ dog", "sister's", "", ["sisters", "sister"]],
          ["pick", "the car of my parents → my ___ car", ["parents'", "parent's", "parents's"], "Mehrzahl auf -s: nur Apostroph."],
          ["pick", "the room of the children → the ___ room", ["children's", "childrens'", "childrens"], "children hat kein -s, also 's."],
          ["gap", "the house of Mr Smith → ___ house", "Mr Smith's", "", ["Mr Smiths", "Mr Smith"]],
          ["pick", "the end ___ the story", ["of", "'s", "from"], "Bei Dingen meist of."],
          ["pick", "Is this ___ pen?", ["Emma's", "Emmas", "Emma"], "Besitz: Emma's."],
          ["pick", "That's my ___ room. (Ich habe zwei Brüder.)", ["brothers'", "brother's", "brothers's"], "Zwei Brüder: Mehrzahl auf -s, nur Apostroph."]
        ] },
      // ---------- Klasse 5, Theme 3 ----------
      { id: "simplepresent", band: "ct-3", t: "Simple present", de: "Gewohnheiten und Tatsachen",
        explain: [
          "Das simple present benutzt du für Gewohnheiten, Regeln und Dinge, die immer so sind. Signalwörter: always, usually, often, sometimes, never, every day.",
          "Bei **he, she, it** hängst du ein **-s** an: I play → she play**s**. Merksatz: „He, she, it – das s muss mit!“",
          "Nach s, sh, ch, x und o kommt **-es**: watch → watch**es**, go → go**es**. Konsonant + y wird zu **-ies**: fly → fl**ies**.",
          "Unregelmäßig: have → **has**, be → **is**."
        ],
        ex: [["I **play** football every Friday.", "Ich spiele jeden Freitag Fußball."], ["My sister **watches** TV after school.", "Meine Schwester sieht nach der Schule fern."], ["Tom **has** a dog.", "Tom hat einen Hund."]],
        tasks: [
          ["gap", "She ___ to school by bus. (go)", "goes", "she → -s, und nach o kommt -es.", ["go", "gos"]],
          ["gap", "My dad ___ the car every Saturday. (wash)", "washes", "Nach sh kommt -es.", ["washs", "wash"]],
          ["gap", "We ___ English on Mondays. (have)", "have", "Bei we bleibt das Verb ohne -s.", ["has", "haves"]],
          ["gap", "Emma ___ a cat. (have)", "has", "Emma = she, und have wird zu has.", ["have", "haves"]],
          ["gap", "The baby ___ a lot. (cry)", "cries", "Konsonant + y wird zu -ies.", ["crys", "cry"]],
          ["pick", "Ben and Lisa ___ in Leeds.", ["live", "lives"], "Ben and Lisa = they, also ohne -s."],
          ["pick", "It ___ a lot in Wales.", ["rains", "rain"], "it → das s muss mit."],
          ["order", "She always reads in bed.", "always steht vor dem Verb."]
        ] },
      { id: "negations", band: "ct-3", t: "Negations", de: "Verneinung",
        explain: [
          "Im simple present verneinst du mit **don't** (do not) oder **doesn't** (does not) und dem Verb ohne -s: I **don't like** fish. She **doesn't like** fish.",
          "Mit am, is, are hängst du **not** an: I'm **not**, he **isn't**, they **aren't**.",
          "Mit can wird es **can't**: My dog **can't** swim."
        ],
        ex: [["I **don't** like spiders.", "Ich mag keine Spinnen."], ["Max **doesn't** eat meat.", "Max isst kein Fleisch."], ["We **aren't** at home.", "Wir sind nicht zu Hause."]],
        tasks: [
          ["gap", "I ___ like spiders. (nicht)", "don't|do not", "", ["doesn't", "not"]],
          ["gap", "Max ___ like spiders. (nicht)", "doesn't|does not", "Max = he, also doesn't.", ["don't", "isn't"]],
          ["pick", "She doesn't ___ milk.", ["drink", "drinks"], "Nach doesn't steht das Verb ohne -s."],
          ["pick", "We ___ at home today.", ["aren't", "don't", "isn't"], "Mit be: we are → we aren't."],
          ["pick", "My dog ___ swim.", ["can't", "doesn't can", "don't"], "can wird zu can't, ohne do."],
          ["gap", "It ___ cold today. (nicht sein)", "isn't|is not", "", ["don't", "aren't"]],
          ["order", "My brother doesn't eat meat."],
          ["pick", "They ___ live in London.", ["don't", "doesn't", "aren't"], "Bei they nimmst du don't."]
        ] },
      { id: "adverbsfreq", band: "ct-3", t: "Adverbs of place, time and frequency", de: "Wo, wann, wie oft",
        explain: [
          "Häufigkeitsadverbien sagen, wie oft etwas passiert: **always** (immer), **usually** (normalerweise), **often** (oft), **sometimes** (manchmal), **never** (nie).",
          "Sie stehen **vor dem Vollverb**: I **often play** tennis.",
          "Nach am, is, are stehen sie **dahinter**: She **is always** late.",
          "Orts- und Zeitangaben stehen meist am Satzende, Ort vor Zeit: We meet **here tomorrow**."
        ],
        ex: [["I **always** have breakfast at seven.", "Ich frühstücke immer um sieben."], ["He is **never** late.", "Er kommt nie zu spät."]],
        tasks: [
          ["order", "I always have breakfast at seven."],
          ["order", "She is never late.", "Nach is steht das Häufigkeitsadverb dahinter."],
          ["pick", "Tom ___ his homework.", ["often forgets", "forgets often"], "Vor dem Vollverb."],
          ["pick", "We ___ tired on Fridays.", ["are usually", "usually are"], "Nach are steht es dahinter."],
          ["order", "My parents sometimes watch films."],
          ["gap", "I ___ eat fish. I hate it! (nie)", "never", "", ["always", "sometimes"]],
          ["pick", "They play football ___.", ["there every day", "every day there"], "Ort vor Zeit."],
          ["order", "He is usually at home."]
        ] },
      { id: "shortanswers", band: "ct-3", t: "Short answers", de: "Kurzantworten",
        explain: [
          "Auf Ja/Nein-Fragen antwortest du im Englischen nicht nur mit Yes oder No. Du nimmst das **Hilfsverb aus der Frage** wieder auf.",
          "**Do** you like cats? – Yes, I **do**. / No, I **don't**.",
          "**Is** she nice? – Yes, she **is**. / No, she **isn't**.",
          "Bei Yes gibt es keine Kurzform: Yes, I **am**. (nicht: Yes, I'm.)"
        ],
        ex: [["Can you swim? – Yes, I **can**.", "Kannst du schwimmen? – Ja."], ["Does Tom like pizza? – No, he **doesn't**.", "Mag Tom Pizza? – Nein."]],
        tasks: [
          ["gap", "Do you like cats? – Yes, I ___.", "do", "", ["am", "does"]],
          ["gap", "Does Tom play football? – No, he ___.", "doesn't|does not", "In der Frage steht does, also doesn't.", ["don't", "isn't"]],
          ["pick", "Are you tired? – Yes, I ___.", ["am", "are", "do"], "Zu you passt in der Antwort I am."],
          ["pick", "Is it raining? – No, it ___.", ["isn't", "doesn't", "aren't"], "In der Frage steht is, also isn't."],
          ["gap", "Can your sister swim? – Yes, she ___.", "can", "", ["does", "is"]],
          ["pick", "Are your parents at home? – No, they ___.", ["aren't", "don't", "isn't"], "Zu they passt are, also aren't."],
          ["pick", "Have you got a pet? – Yes, I ___.", ["have", "got", "do"], "Have you got … ? – Yes, I have."],
          ["gap", "Does your dog bark a lot? – Yes, it ___.", "does", "", ["is", "do"]]
        ] },
      { id: "questions", band: "ct-3", t: "Questions", de: "Fragen stellen",
        explain: [
          "Fragen im simple present baust du mit **do** oder **does**: **Do** you like pizza? **Does** she like pizza?",
          "Nach does steht das Verb **ohne -s**: Does he **play** tennis? (nicht: Does he plays)",
          "Ein Fragewort steht ganz vorn: **Where** do you live? **What** does she want? **When** is your birthday?",
          "Mit am, is, are und can brauchst du kein do: **Are** you ready? **Is** he at home? **Can** you swim?"
        ],
        ex: [["**Do** you **like** cats?", "Magst du Katzen?"], ["**Where does** your aunt **live**?", "Wo wohnt deine Tante?"], ["**Is** your dog old?", "Ist dein Hund alt?"]],
        tasks: [
          ["pick", "___ you like football?", ["Do", "Does", "Are"], "Bei you nimmst du do."],
          ["pick", "___ your brother play the guitar?", ["Does", "Do", "Is"], "your brother = he, also does."],
          ["pick", "___ she at home?", ["Is", "Does", "Do"], "Mit be (is) brauchst du kein do."],
          ["gap", "Where ___ you live?", "do", "Bei you nimmst du do.", ["does", "are"]],
          ["gap", "What time ___ the film start?", "does", "the film = it, also does.", ["do", "is"]],
          ["pick", "Does he ___ chips?", ["like", "likes"], "Nach does steht das Verb ohne -s."],
          ["pick", "___ is your birthday? – In May.", ["When", "Who", "Where"], "Die Antwort ist eine Zeit, also when."],
          ["order", "Where does your aunt live?", "Fragewort, dann does, dann Person, dann Verb."]
        ] },
      // ---------- Klasse 5, Theme 4 ----------
      { id: "presentprog", band: "ct-4", t: "Present progressive", de: "Was gerade passiert",
        explain: [
          "Mit dem present progressive sagst du, was **gerade jetzt** passiert. Signalwörter: now, right now, at the moment, Look!, Listen!",
          "Form: **am/is/are + Verb mit -ing**: I **am reading**. She **is playing**. They **are running**.",
          "Schreibung: Ein stummes e fällt weg: make → mak**ing**. Nach kurzem Vokal wird der Konsonant verdoppelt: swim → swi**mm**ing, run → ru**nn**ing.",
          "Unterschied: simple present = immer oder oft, present progressive = jetzt gerade."
        ],
        ex: [["Look! It **is snowing**.", "Schau! Es schneit."], ["I **am doing** my homework at the moment.", "Ich mache gerade meine Hausaufgaben."]],
        tasks: [
          ["gap", "Look! The dog ___ in the garden. (run)", "is running|'s running", "is + run + n + ing.", ["runs", "is runing"]],
          ["gap", "I ___ a book at the moment. (read)", "am reading|'m reading", "", ["read", "reading"]],
          ["gap", "Listen! They ___ a song. (sing)", "are singing|'re singing", "", ["sing", "is singing"]],
          ["gap", "We ___ in the lake right now. (swim)", "are swimming|'re swimming", "swim → swimming mit Doppel-m.", ["are swiming", "swim"]],
          ["pick", "Be quiet! The baby ___.", ["is sleeping", "sleeps"], "Es passiert gerade jetzt."],
          ["pick", "My dad ___ to work every day.", ["goes", "is going"], "every day = Gewohnheit, also simple present."],
          ["gap", "What ___ you doing?", "are", "", ["do", "is"]],
          ["pick", "Mum ___ dinner right now.", ["is making", "is makeing", "makes"], "make → making, das e fällt weg."]
        ] },
      { id: "someany", band: "ct-4", t: "some/any", de: "etwas, einige, keine",
        explain: [
          "**some** steht meist in **bejahten** Sätzen: I've got **some** apples.",
          "**any** steht in **Fragen** und **verneinten** Sätzen: Have you got **any** apples? I haven't got **any** apples.",
          "Bei Angeboten und Bitten nimmst du **some**, auch in Fragen: Would you like **some** tea? Can I have **some** water?",
          "Genauso: something/anything, somebody/anybody."
        ],
        ex: [["There are **some** biscuits.", "Da sind ein paar Kekse."], ["Is there **any** milk?", "Gibt es Milch?"], ["Would you like **some** juice?", "Möchtest du etwas Saft?"]],
        tasks: [
          ["pick", "There are ___ biscuits on the table.", ["some", "any"], "Bejahter Satz: some."],
          ["pick", "Is there ___ milk in the fridge?", ["any", "some"], "Frage: any."],
          ["pick", "I haven't got ___ money.", ["any", "some"], "Verneinter Satz: any."],
          ["pick", "Would you like ___ juice?", ["some", "any"], "Angebot: some, auch in der Frage."],
          ["pick", "We need ___ eggs for the cake.", ["some", "any"]],
          ["pick", "Have you got ___ brothers or sisters?", ["any", "some"]],
          ["pick", "There isn't ___ bread left.", ["any", "some"]],
          ["pick", "Can I have ___ water, please?", ["some", "any"], "Bitte: some, auch in der Frage."]
        ] },
      { id: "conjunctions", band: "ct-4", t: "Conjunctions", de: "and, but, or, because, so",
        explain: [
          "Konjunktionen verbinden Sätze: **and** (und), **but** (aber), **or** (oder), **because** (weil), **so** (also, deshalb).",
          "**because** nennt den Grund: I'm happy **because** it's my birthday.",
          "**so** nennt die Folge: It's raining, **so** we stay at home.",
          "Nach because bleibt die normale Satzstellung: … because **she loves** her party. (Deutsch: weil sie ihre Party liebt.)"
        ],
        ex: [["Caroline is happy **because** she loves her party.", "Caroline ist froh, weil sie ihre Party liebt."], ["I like cats, **but** I don't like dogs.", "Ich mag Katzen, aber keine Hunde."]],
        tasks: [
          ["pick", "I like pizza ___ chips.", ["and", "but", "so"]],
          ["pick", "I'm tired, ___ I go to bed.", ["so", "because", "but"], "Die Folge: so."],
          ["pick", "Tom is sad ___ his cat is ill.", ["because", "so", "or"], "Der Grund: because."],
          ["pick", "Do you want tea ___ juice?", ["or", "but", "because"], "oder = or."],
          ["pick", "Emma likes maths, ___ she doesn't like art.", ["but", "so", "or"]],
          ["gap", "We stay at home ___ it's raining. (weil)", "because", "", ["but", "so"]],
          ["order", "I'm happy because it's my birthday."],
          ["pick", "She is happy because ___.", ["she has got a new bike", "has she got a new bike", "she a new bike has got"], "Nach because: Subjekt – Verb – Objekt."]
        ] },
      // ---------- Klasse 5, Theme 5 ----------
      { id: "objectpronouns", band: "ct-5", t: "Object pronouns", de: "mich, dich, ihn …",
        explain: [
          "Objektpronomen stehen nach dem Verb oder nach einer Präposition: **me, you, him, her, it, us, you, them**.",
          "I → **me**, he → **him**, she → **her**, we → **us**, they → **them**. you und it bleiben gleich.",
          "Gillian sees Oscar. She talks to **him**. Can you help **me**?",
          "Auch nach Präpositionen: with **us**, for **them**, to **her**."
        ],
        ex: [["Gillian sees Oscar. She talks to **him**.", "Gillian sieht Oscar. Sie spricht mit ihm."], ["Can you help **me**?", "Kannst du mir helfen?"], ["I like **them**.", "Ich mag sie."]],
        tasks: [
          ["pick", "Where is Tom? I can't see ___.", ["him", "he", "his"]],
          ["pick", "Lisa is nice. I like ___.", ["her", "she", "hers"]],
          ["gap", "Can you help ___? (ich)", "me", "", ["I", "my"]],
          ["pick", "My grandparents live in York. We often visit ___.", ["them", "they", "their"]],
          ["gap", "Come with ___! (wir)", "us", "", ["we", "our"]],
          ["pick", "This is my new bike. Do you like ___?", ["it", "its", "them"]],
          ["pick", "The dog is hungry. Give ___ some food.", ["it", "its", "it's"]],
          ["gap", "This present is for ___. (sie, Mehrzahl)", "them", "", ["they", "their"]]
        ] },
      { id: "modals", band: "ct-5", t: "Modal verbs", de: "must, mustn't, should, shouldn't",
        explain: [
          "Modalverben sagen, ob man etwas kann, muss, darf oder sollte: **can** (kann, darf), **must** (muss), **mustn't** (darf nicht), **should** (sollte), **shouldn't** (sollte nicht).",
          "Wie bei can: kein -s bei he, she, it und danach die Grundform ohne to: He **must go** home.",
          "Achtung, falscher Freund: **mustn't** heißt **darf nicht**, nicht muss nicht. Dogs mustn't eat chocolate = Hunde dürfen keine Schokolade fressen.",
          "**should** ist ein Rat: You **should** drink some water."
        ],
        ex: [["Dogs **mustn't** eat ice cream.", "Hunde dürfen kein Eis fressen."], ["You **shouldn't** take your pet to school.", "Du solltest dein Haustier nicht mit in die Schule nehmen."], ["I **must** feed my cat.", "Ich muss meine Katze füttern."]],
        tasks: [
          ["pick", "You ___ eat chocolate before dinner. (darfst nicht)", ["mustn't", "needn't", "must"], "darf nicht = mustn't."],
          ["pick", "She ___ go to the vet with her dog. (muss)", ["must", "musts", "must to"], "must bleibt immer gleich."],
          ["pick", "You're tired. You ___ go to bed. (solltest)", ["should", "shouldn't", "mustn't"]],
          ["pick", "„Du darfst hier nicht rennen.“ heißt:", ["You mustn't run here.", "You don't must run here.", "You must not to run here."], "darf nicht = mustn't, ohne do und ohne to."],
          ["gap", "Rabbits ___ live alone. They're happier in pairs. (sollten nicht)", "shouldn't|should not", "", ["mustn't", "don't should"]],
          ["pick", "He must ___ his room.", ["tidy", "tidies", "to tidy"], "Nach must steht die Grundform."],
          ["gap", "You ___ feed your pet every day. (musst)", "must", "", ["mustn't", "should not"]],
          ["order", "You shouldn't take your pet to school."]
        ] },
      { id: "wordorder", band: "ct-5", t: "Word order (SPO)", de: "Satzstellung",
        explain: [
          "Im englischen Satz gilt fast immer: **S**ubjekt – **P**rädikat (Verb) – **O**bjekt.",
          "Das gilt auch, wenn der Satz mit einer Zeitangabe beginnt, anders als im Deutschen: Heute **spiele ich** Fußball. → Today **I play** football.",
          "Auch im Nebensatz bleibt die Reihenfolge gleich: … because **I like** it. (Deutsch: weil ich es mag.)",
          "Ort steht vor Zeit, wie im Alphabet O vor Z: I go **to school** **every day**."
        ],
        ex: [["Today **I play** football.", "Heute spiele ich Fußball."], ["I'm happy because **I have** a new bike.", "Ich bin froh, weil ich ein neues Fahrrad habe."]],
        tasks: [
          ["order", "Today I play football.", "Auch nach Today kommt zuerst das Subjekt I."],
          ["order", "I like Tom because he is funny.", "Im Nebensatz bleibt Subjekt vor Verb: he is."],
          ["order", "We go to the cinema on Saturday.", "Ort vor Zeit."],
          ["order", "My mum drinks coffee every morning."],
          ["pick", "On Sunday ___ my grandma.", ["I visit", "visit I"], "Subjekt vor Verb, auch nach On Sunday."],
          ["pick", "I'm happy because ___.", ["I have a new bike", "have I a new bike", "a new bike I have"], "Im Nebensatz: Subjekt – Verb – Objekt."],
          ["pick", "We play ___.", ["in the garden every day", "every day in the garden"], "Ort vor Zeit."],
          ["order", "She meets her friends in the park after school.", "Ort (in the park) vor Zeit (after school)."]
        ] },
      { id: "thisthat", band: "ct-5", t: "this, that, these, those", de: "dieser hier, der dort",
        explain: [
          "**this** (dieser, diese, dieses hier) und **these** (diese hier) zeigen auf etwas in der Nähe.",
          "**that** (der, die, das dort) und **those** (die dort) zeigen auf etwas weiter weg.",
          "Einzahl: this, that. Mehrzahl: these, those."
        ],
        ex: [["**This** is my hamster.", "Das hier ist mein Hamster."], ["Look at **those** horses!", "Schau dir die Pferde dort an!"]],
        tasks: [
          ["pick", "___ book here is great.", ["This", "These", "Those"], "Einzahl, nah: this."],
          ["pick", "Look at ___ birds over there!", ["those", "these", "that"], "Mehrzahl, weit weg: those."],
          ["pick", "___ shoes here are too small.", ["These", "This", "Those"], "Mehrzahl, nah: these."],
          ["pick", "Who is ___ girl over there?", ["that", "those", "this"], "Einzahl, weit weg: that."],
          ["gap", "Are ___ your keys here on the table? (diese hier)", "these", "", ["this", "those"]],
          ["gap", "Is ___ your house over there? (das dort)", "that", "", ["this", "these"]],
          ["pick", "I like ___ T-shirt. (dieses hier)", ["this", "these", "that"]],
          ["pick", "___ are my friends Tom and Ben. (diese hier)", ["These", "This", "That"]]
        ] },
      // ---------- Klasse 6 ----------
      { id: "simplepast", band: "6", t: "Simple past", de: "Was früher passiert ist",
        explain: [
          "Mit dem simple past erzählst du, was in der Vergangenheit passiert und abgeschlossen ist. Signalwörter: yesterday, last week, two days ago, in 2020.",
          "Regelmäßige Verben bekommen **-ed**: play → play**ed**, live → live**d**, stop → sto**pped**, cry → cr**ied**.",
          "Unregelmäßige Verben lernst du auswendig: go → **went**, see → **saw**, have → **had**, be → **was/were**.",
          "Fragen und Verneinung bildest du mit **did** und der Grundform: **Did** you **see** it? I **didn't see** it."
        ],
        ex: [["Yesterday we **played** football.", "Gestern haben wir Fußball gespielt."], ["Last summer I **went** to Spain.", "Letzten Sommer bin ich nach Spanien gefahren."], ["**Did** you **like** the film?", "Hat dir der Film gefallen?"]],
        tasks: [
          ["gap", "Yesterday we ___ football. (play)", "played", "", ["play", "plaied"]],
          ["gap", "Last summer I ___ to Spain. (go)", "went", "go ist unregelmäßig: went.", ["goed", "go"]],
          ["gap", "She ___ a fox in the park. (see)", "saw", "see ist unregelmäßig: saw.", ["seed", "see"]],
          ["gap", "The baby ___ all night. (cry)", "cried", "Konsonant + y wird zu -ied.", ["cryed", "crys"]],
          ["pick", "I ___ tired yesterday.", ["was", "were", "am"], "I → was."],
          ["pick", "___ you watch the match last night?", ["Did", "Do", "Was"], "Frage in der Vergangenheit: did."],
          ["pick", "We didn't ___ the bus.", ["catch", "caught", "catched"], "Nach didn't steht die Grundform."],
          ["gap", "They ___ at home last weekend. (nicht sein)", "weren't|were not", "they → were, verneint weren't.", ["wasn't", "didn't be"]]
        ] },
      { id: "countable", band: "6", t: "Countable and uncountable nouns", de: "Zählbar oder nicht",
        explain: [
          "Zählbare Nomen kannst du zählen: one apple, two apples.",
          "Nicht zählbare Nomen haben **keine Mehrzahl** und **kein a/an**: water, milk, money, bread, information, homework, advice, furniture, news.",
          "Achtung: Manches ist im Deutschen zählbar, im Englischen nicht. Informationen → **information**, Hausaufgaben → **homework**, Ratschläge → **advice**.",
          "Wenn du doch zählen willst: **a piece of** cake, **a bottle of** water, **a glass of** milk."
        ],
        ex: [["My **homework is** easy today.", "Meine Hausaufgaben sind heute leicht."], ["Can I have **a glass of** milk?", "Kann ich ein Glas Milch haben?"]],
        tasks: [
          ["pick", "My ___ is too difficult.", ["homework", "homeworks"], "homework hat keine Mehrzahl."],
          ["pick", "Can you give me some ___?", ["advice", "advices"], "advice hat keine Mehrzahl."],
          ["pick", "I'd like ___ water.", ["a glass of", "a", "an"], "water ist nicht zählbar."],
          ["pick", "The furniture in my room ___ new.", ["is", "are"], "furniture ist nicht zählbar, also is."],
          ["pick", "There ___ two apples on the table.", ["are", "is"], "apples ist zählbar und Mehrzahl."],
          ["gap", "Can I have a ___ of cake? (Stück)", "piece", "", ["much", "many"]],
          ["pick", "I need some ___ about the trip.", ["information", "informations"], "information hat keine Mehrzahl."],
          ["pick", "I've got ___ good news!", ["some", "a"], "news ist nicht zählbar."]
        ] },
      { id: "quantifiers", band: "6", t: "Quantifiers", de: "much, many, a little, a few",
        explain: [
          "**many** und **a few** stehen bei zählbaren Nomen in der Mehrzahl: many friends, a few apples.",
          "**much** und **a little** stehen bei nicht zählbaren Nomen: much money, a little milk.",
          "Fragen: How **many** …? How **much** …? (auch: How much is it? = Wie viel kostet es?)",
          "In bejahten Sätzen sagt man oft **a lot of** oder **lots of**. Das passt zu beidem."
        ],
        ex: [["How **many** brothers have you got?", "Wie viele Brüder hast du?"], ["There isn't **much** time.", "Es ist nicht viel Zeit."], ["I've got **a few** friends here.", "Ich habe hier ein paar Freunde."]],
        tasks: [
          ["pick", "How ___ brothers have you got?", ["many", "much"], "brothers kann man zählen."],
          ["pick", "How ___ sugar do you want?", ["much", "many"], "sugar ist nicht zählbar."],
          ["pick", "There isn't ___ milk left.", ["much", "many"]],
          ["pick", "I've got a ___ friends in Berlin.", ["few", "little"], "friends kann man zählen."],
          ["pick", "Can I have a ___ water?", ["little", "few"], "water ist nicht zählbar."],
          ["pick", "We haven't got ___ time.", ["much", "many"]],
          ["pick", "There are ___ people at the party.", ["a lot of", "much"], "a lot of passt zu allem."],
          ["gap", "How ___ is the T-shirt? – It's £10.", "much", "", ["many", "more"]]
        ] },
      { id: "presentperfect", band: "6", t: "Present perfect simple", de: "Schon passiert, wichtig für jetzt",
        explain: [
          "Mit dem present perfect sagst du, dass etwas **schon passiert ist** und für **jetzt** wichtig ist. Wann genau, ist egal. Signalwörter: already, ever, never, just, yet.",
          "Form: **have/has + 3. Form** des Verbs: I **have finished**. She **has seen** it.",
          "Regelmäßige Verben: -ed (played). Unregelmäßige aus der Tabelle: go – went – **gone**, see – saw – **seen**, eat – ate – **eaten**.",
          "Kurzformen: I**'ve**, she**'s**, I **haven't**, he **hasn't**."
        ],
        ex: [["I **have** just **finished** my homework.", "Ich habe gerade meine Hausaufgaben fertig gemacht."], ["**Have** you ever **been** to London?", "Warst du schon einmal in London?"]],
        tasks: [
          ["gap", "I ___ my homework. (finish)", "have finished|'ve finished", "", ["finished", "have finish"]],
          ["gap", "She ___ this film three times. (see)", "has seen|'s seen", "see – saw – seen.", ["has saw", "have seen"]],
          ["pick", "Have you ___ been to London?", ["ever", "yet"], "Schon einmal = ever."],
          ["gap", "We have just ___ lunch. (eat)", "eaten", "eat – ate – eaten.", ["ate", "eat"]],
          ["pick", "Tom ___ lost his key.", ["has", "have"], "Tom = he, also has."],
          ["pick", "They have ___ to the beach.", ["gone", "went", "go"], "Nach have steht die 3. Form."],
          ["pick", "I have never ___ a horse.", ["ridden", "rode", "ride"], "ride – rode – ridden."],
          ["gap", "My parents ___ a new car. (buy)", "have bought|'ve bought", "buy – bought – bought.", ["have buyed", "bought"]]
        ] },
      { id: "goingto", band: "6", t: "going to-future", de: "Pläne und Absichten",
        explain: [
          "Mit **going to** sprichst du über **Pläne**: I**'m going to** visit my aunt next week.",
          "Und über etwas, das man **schon kommen sieht**: Look at the clouds! It**'s going to** rain.",
          "Form: **am/is/are + going to + Grundform**."
        ],
        ex: [["I**'m going to** learn the guitar.", "Ich werde Gitarre lernen."], ["Watch out! You**'re going to** fall!", "Pass auf! Du fällst gleich!"]],
        tasks: [
          ["gap", "I ___ going to buy a new bike.", "am|'m", "", ["is", "are"]],
          ["gap", "My sister ___ going to learn Spanish.", "is|'s", "", ["are", "am"]],
          ["pick", "We are going to ___ a party.", ["have", "having", "has"], "Nach going to steht die Grundform."],
          ["gap", "Look at that boy! He ___ fall! (going to)", "is going to|'s going to", "", ["will going to", "is go to"]],
          ["pick", "___ you going to watch the match?", ["Are", "Do", "Will"], "Frage: Are you going to … ?"],
          ["order", "I am going to visit my grandma."],
          ["pick", "They ___ going to stay at home.", ["are", "is"]],
          ["gap", "What ___ you going to do this weekend?", "are", "", ["is", "do"]]
        ] },
      { id: "will", band: "6", t: "will-future", de: "Vorhersagen und spontane Entschlüsse",
        explain: [
          "Mit **will** sagst du voraus, was passieren wird: I think it **will** rain tomorrow.",
          "Auch für spontane Entschlüsse: The phone is ringing. – I**'ll** get it!",
          "Form: **will + Grundform**, für alle Personen gleich. Kurz: I'll, she'll. Verneint: **won't** (will not).",
          "Achtung, falscher Freund: I will = ich **werde**, nicht ich will. Ich will = I **want**."
        ],
        ex: [["Maybe we **will** live on Mars one day.", "Vielleicht werden wir eines Tages auf dem Mars leben."], ["I **won't** tell anyone.", "Ich werde es niemandem sagen."]],
        tasks: [
          ["gap", "I think it ___ snow tomorrow.", "will|'ll", "", ["is", "going"]],
          ["pick", "She will ___ you later.", ["call", "calls", "to call"], "Nach will steht die Grundform."],
          ["gap", "Don't worry, I ___ tell anyone. (nicht werden)", "won't|will not", "", ["don't", "not will"]],
          ["pick", "„Ich will ein Eis.“ heißt auf Englisch:", ["I want an ice cream.", "I will an ice cream."], "ich will = I want."],
          ["pick", "Maybe we ___ live on Mars one day.", ["will", "are"]],
          ["order", "I think you will like the film."],
          ["pick", "It's cold in here. – OK, I ___ close the window.", ["'ll", "am"], "Spontaner Entschluss: I'll."],
          ["gap", "___ you help me, please? (werden)", "Will", "", ["Do", "Are"]]
        ] },
      { id: "comparison", band: "6", t: "Comparison of adjectives", de: "Steigerung und Vergleich",
        explain: [
          "Kurze Adjektive und solche auf -y: **-er** und **the -est**: small – small**er** – the small**est**, happy – happ**ier** – the happ**iest**, big – bi**gg**er – the bi**gg**est.",
          "Lange Adjektive: **more** und **the most**: interesting – **more** interesting – **the most** interesting.",
          "Unregelmäßig: good – **better** – the **best**, bad – **worse** – the **worst**.",
          "Vergleich mit **than** (als): Tom is taller **than** Ben. Gleich: **as … as**: Ben is **as** tall **as** his dad."
        ],
        ex: [["An elephant is **bigger than** a dog.", "Ein Elefant ist größer als ein Hund."], ["This is **the best** day ever!", "Das ist der beste Tag überhaupt!"]],
        tasks: [
          ["gap", "An elephant is ___ than a dog. (big)", "bigger", "big → bigger mit Doppel-g.", ["biger", "more big"]],
          ["gap", "This is the ___ day of my life! (happy)", "happiest", "y wird zu i: happiest.", ["happyest", "most happy"]],
          ["gap", "Maths is ___ than art. (difficult)", "more difficult", "Lange Adjektive: more.", ["difficulter", "most difficult"]],
          ["gap", "My cake is ___ than yours. (good)", "better", "good – better – best.", ["gooder", "best"]],
          ["gap", "This is the ___ film I've ever seen. (bad)", "worst", "bad – worse – worst.", ["baddest", "worse"]],
          ["pick", "Lisa is older ___ her brother.", ["than", "as", "then"], "als = than."],
          ["pick", "My bike is as fast ___ yours.", ["as", "than"], "as … as."],
          ["gap", "This is the ___ mountain in England. (high)", "highest", "", ["higher", "most high"]]
        ] },
      { id: "adverbsmanner", band: "6", rez: true, t: "Adverbs of manner", de: "Wie jemand etwas tut",
        explain: [
          "Ein Adjektiv beschreibt ein Nomen: a **quiet** girl. Ein Adverb beschreibt, **wie** jemand etwas tut: She speaks **quietly**.",
          "Meist hängt man **-ly** an: slow → slow**ly**, careful → careful**ly**, happy → happ**ily**.",
          "Ausnahmen: good → **well**, fast → **fast**, hard → **hard**.",
          "In Klasse 5/6 sollst du Adverbien vor allem erkennen. Selbst bilden kommt in Klasse 7/8."
        ],
        ex: [["She sings **beautifully**.", "Sie singt wunderschön."], ["He plays **well**.", "Er spielt gut."]],
        tasks: [
          ["pick", "She sings very ___.", ["well", "good"], "Wie singt sie? Adverb von good ist well."],
          ["pick", "He is a ___ driver.", ["careful", "carefully"], "driver ist ein Nomen, also Adjektiv."],
          ["pick", "Please walk ___.", ["slowly", "slow"], "Wie gehen? Adverb."],
          ["pick", "Tom runs very ___.", ["fast", "fastly"], "fast bleibt fast."],
          ["pick", "The children played ___.", ["happily", "happy"]],
          ["pick", "It's a ___ day.", ["beautiful", "beautifully"], "day ist ein Nomen, also Adjektiv."],
          ["pick", "Welches Wort ist in „She closed the door quietly.“ das Adverb?", ["quietly", "door", "closed"]],
          ["pick", "Lisa works ___. She is always busy.", ["hard", "hardly"], "hard bleibt hard. hardly heißt kaum."]
        ] },

      // ---------- Klassen 7/8 (Übungen folgen) ----------
      { id: "zeroarticle1", band: "7/8", t: "(Zero) article", de: "Artikel bei Gebäuden, Institutionen, Namen" },
      { id: "if12", band: "7/8", t: "Conditional clauses I and II", de: "if-Sätze Typ 1 und 2" },
      { id: "adverbialclauses", band: "7/8", t: "Adverbial clauses", de: "Nebensätze für Zeit, Grund, Folge, Zweck, Gegensatz" },
      { id: "relative", band: "7/8", t: "Relative clauses", de: "Relativsätze mit who, which, that, whose" },
      { id: "ppsp", band: "7/8", t: "Present perfect / simple past", de: "Die beiden Zeiten im Vergleich" },
      { id: "ppprog", band: "7/8", t: "Present perfect progressive", de: "Seit wann etwas andauert" },
      { id: "pastprog", band: "7/8", t: "Past progressive", de: "Was gerade passierte, als …" },
      { id: "pastperfect", band: "7/8", t: "Past perfect", de: "Vorvergangenheit" },
      { id: "pastperfectprog", band: "7/8", rez: true, t: "Past perfect progressive", de: "Verlaufsform der Vorvergangenheit" },
      { id: "adverbsdegree", band: "7/8", t: "Adverbs of manner and degree", de: "Adverbien bilden und steigern" },
      { id: "adverbscomp", band: "7/8", t: "Comparison of adverbs", de: "Handlungen vergleichen" },
      { id: "passive1", band: "7/8", rez: true, t: "Passive voice", de: "Passiv mit und ohne by" },
      { id: "reported", band: "7/8", t: "Reported speech", de: "Indirekte Rede mit Zeitverschiebung, Fragen und Aufforderungen" },

      // ---------- Klassen 9/10 ----------
      { id: "zeroarticle2", band: "9/10", t: "(Zero) article", de: "Artikel bei abstrakten Begriffen" },
      { id: "if3", band: "9/10", t: "Conditional clauses III", de: "if-Sätze Typ 3" },
      { id: "adverbials", band: "9/10", t: "Adverbials", de: "Satzverbindungen und Adverbiale" },
      { id: "infpart1", band: "9/10", rez: true, t: "Infinitive and participle constructions", de: "statt Nebensätzen (erkennen)" },
      { id: "relative2", band: "9/10", t: "Defining and non-defining relative clauses", de: "notwendige und nicht notwendige Relativsätze, contact clauses" },
      { id: "passive2", band: "9/10", t: "Passive voice", de: "auch Infinitiv, Verben mit zwei Objekten und mit Präpositionen" },
      { id: "futuretenses", band: "9/10", g8: true, t: "Future tenses", de: "die Zukunftsformen im Vergleich" },
      { id: "stative", band: "9/10", g8: true, t: "Stative and dynamic verbs", de: "Zustandsverben" },
      { id: "gerund", band: "9/10", g8: true, t: "Gerund constructions", de: "das Gerundium" },

      // ---------- Klasse 11 und 12/13 ----------
      { id: "infpart2", band: "11", t: "Infinitive and participle constructions", de: "statt Nebensätzen (selbst bilden)" },
      { id: "inversion", band: "12/13", rez: true, t: "Inversion", de: "Umstellung zur Betonung" },
      { id: "doemphasis", band: "12/13", t: "do-emphasis", de: "Betonung mit do (Leistungsfach)" },
      { id: "tags", band: "12/13", t: "Question tags", de: "Frageanhängsel (Leistungsfach)" }
    ]
  },

  Französisch: {
    source: "Bildungsplan BW, Gymnasium (G9), Französisch als zweite Fremdsprache, V3.0 (2026)",
    bands: [
      { id: "6/7/8", label: "Klassen 6/7/8", note: "Französisch als zweite Fremdsprache ab Klasse 6" },
      { id: "9/10", label: "Klassen 9/10" },
      { id: "11", label: "Klasse 11" },
      { id: "12/13", label: "Klassen 12/13" }
    ],
    topics: [
      { id: "fr-nom", band: "6/7/8", t: "Nomen und Artikel", de: "Singular, Plural, bestimmter und unbestimmter Artikel" },
      { id: "fr-artcontr", band: "6/7/8", t: "Zusammengezogener Artikel", de: "au, aux, du, des" },
      { id: "fr-demo", band: "6/7/8", t: "Demonstrativbegleiter", de: "ce, cet, cette, ces" },
      { id: "fr-poss", band: "6/7/8", t: "Possessivbegleiter", de: "mon, ma, mes …" },
      { id: "fr-adj", band: "6/7/8", t: "Adjektive", de: "Angleichung und Stellung" },
      { id: "fr-pron", band: "6/7/8", t: "Subjekt- und unverbundene Pronomen", de: "je, tu … / moi, toi …" },
      { id: "fr-obj", band: "6/7/8", t: "Objektpronomen", de: "le, la, les, lui, leur" },
      { id: "fr-yen1", band: "6/7/8", t: "y und en in festen Wendungen", de: "il y a, j'y vais, j'en ai marre" },
      { id: "fr-indef", band: "6/7/8", t: "Indefinita", de: "quelqu'un, quelque chose, tout, chaque" },
      { id: "fr-adv1", band: "6/7/8", t: "Adverbien", de: "bien, mal, toujours, déjà …" },
      { id: "fr-rel1", band: "6/7/8", t: "Relativsätze", de: "qui, que, où" },
      { id: "fr-refl", band: "6/7/8", t: "Reflexive Verben", de: "se lever, s'appeler …" },
      { id: "fr-present", band: "6/7/8", t: "Présent", de: "regelmäßige und wichtige unregelmäßige Verben" },
      { id: "fr-imp", band: "6/7/8", t: "Imperativ", de: "Aufforderungen" },
      { id: "fr-modal", band: "6/7/8", t: "vouloir, devoir, pouvoir, il faut", de: "Modalverben" },
      { id: "fr-futcomp", band: "6/7/8", t: "Futur composé", de: "aller + Infinitiv" },
      { id: "fr-pc", band: "6/7/8", t: "Passé composé", de: "mit avoir und être, Angleichung bei être" },
      { id: "fr-imparfait", band: "6/7/8", t: "Imparfait", de: "Beschreibungen in der Vergangenheit" },
      { id: "fr-questions", band: "6/7/8", t: "Fragen", de: "Intonation, est-ce que, Fragewörter, quel" },
      { id: "fr-indirect1", band: "6/7/8", t: "Indirekte Rede und Frage", de: "il dit que, il demande si" },
      { id: "fr-neg", band: "6/7/8", t: "Verneinung", de: "ne … pas, plus, rien, jamais, personne, pas encore" },
      { id: "fr-numbers", band: "6/7/8", t: "Zahlen", de: "Grund- und Ordnungszahlen" },
      { id: "fr-partitif", band: "6/7/8", t: "Teilungsartikel und Mengenangaben", de: "du, de la, beaucoup de …" },
      { id: "fr-comp1", band: "6/7/8", t: "Steigerung von Adjektiven", de: "plus … que, le plus …" },
      { id: "fr-cond1", band: "6/7/8", t: "Conditionnel in festen Wendungen", de: "je voudrais, on pourrait, il faudrait" },
      { id: "fr-conj", band: "6/7/8", t: "Begründen und folgern", de: "parce que, donc, alors, pour + Infinitiv" },

      { id: "fr-quelque", band: "9/10", t: "quelque, quelques", de: "einige" },
      { id: "fr-adv2", band: "9/10", t: "Abgeleitete Adverbien", de: "-ment, -amment" },
      { id: "fr-rel2", band: "9/10", t: "Relativpronomen mit Präpositionen", de: "à qui, ce qui, ce que" },
      { id: "fr-cest", band: "9/10", t: "Hervorhebung", de: "c'est … qui, c'est … que" },
      { id: "fr-en", band: "9/10", t: "Adverbialpronomen en", de: "j'en ai besoin, j'en achète trois" },
      { id: "fr-subj1", band: "9/10", t: "Subjonctif présent", de: "nach Meinung, Wunsch und Gefühl" },
      { id: "fr-cond2", band: "9/10", t: "Conditionnel présent", de: "Bitten und Vorschläge" },
      { id: "fr-pcimp", band: "9/10", t: "Passé composé und imparfait", de: "Handlungskette und Hintergrund" },
      { id: "fr-futsimple", band: "9/10", t: "Futur simple", de: "die einfache Zukunft" },
      { id: "fr-gerondif1", band: "9/10", t: "Gérondif", de: "en + -ant" },
      { id: "fr-neg2", band: "9/10", t: "Erweiterte Verneinung", de: "personne ne, rien ne, ne … que" },
      { id: "fr-comp2", band: "9/10", t: "Steigerung von Adverbien", de: "mieux, le mieux …" },
      { id: "fr-si1", band: "9/10", t: "Bedingungssätze mit si", de: "real und irreal in der Gegenwart" },
      { id: "fr-connect", band: "9/10", t: "Verknüpfungen", de: "par conséquent, pourtant, sans + Infinitiv" },

      { id: "fr-celui", band: "11", t: "celui qui, lequel", de: "Demonstrativ- und Relativpronomen" },
      { id: "fr-passif", band: "11", t: "Passiv", de: "im Präsens und in der Vergangenheit" },
      { id: "fr-y", band: "11", t: "Adverbialpronomen y", de: "je m'y intéresse" },
      { id: "fr-subj2", band: "11", t: "Subjonctif nach Konjunktionen", de: "pour que, bien que, sans que" },
      { id: "fr-pqp", band: "11", t: "Plus-que-parfait", de: "Vorvergangenheit" },
      { id: "fr-avantde", band: "11", t: "avant de, après avoir", de: "Infinitivkonstruktionen" },
      { id: "fr-condpasse", band: "11", t: "Conditionnel passé und si-Sätze der Vergangenheit", de: "irreale Bedingungen" },

      { id: "fr-dont", band: "12/13", t: "dont", de: "Relativpronomen" },
      { id: "fr-accord", band: "12/13", t: "Angleichung des participe passé bei avoir", de: "mit vorangehendem Objekt" },
      { id: "fr-indirect2", band: "12/13", t: "Indirekte Rede mit Zeitenfolge", de: "concordance des temps" },
      { id: "fr-ni", band: "12/13", t: "ne … ni … ni, aucun ne", de: "erweiterte Verneinung" },
      { id: "fr-ppresent", band: "12/13", t: "Participe présent und passé simple", de: "Schriftsprache" }
    ]
  }
};

// Bewegte Eselsbrücken zur Grammatik: Satz a verwandelt sich vor den Augen in Satz b.
(() => {
  const A = {
    plural: [{ a: "one cat", b: "two cats", hint: "Mehr als eins? Dann hängt ein **-s** dran." }],
    articles: [{ a: "a banana", b: "an apple", hint: "Vor a, e, i, o, u (gesprochen) wird **a** zu **an**." }],
    tobe: [{ a: "I am happy.", b: "She is happy.", hint: "**I am**, **you are**, **he/she/it is**." }],
    bequestions: [{ a: "You are twelve.", b: "Are you twelve?", hint: "Für die Frage tauschen **are** und **you** die Plätze." }],
    thereis: [{ a: "There is a cat.", b: "There are two cats.", hint: "Eins: **there is**. Mehrere: **there are**." }],
    commands: [{ a: "You open the door.", b: "Open the door!", hint: "Beim Befehl fällt **you** einfach weg." }],
    can: [{ a: "She plays the guitar.", b: "She can play the guitar.", hint: "Nach **can** steht das Verb ohne -s." }],
    havegot: [{ a: "I have got a dog.", b: "She has got a dog.", hint: "Bei he/she/it heißt es **has got**." }],
    genitive: [{ a: "the bike of Tom", b: "Tom's bike", hint: "Wem gehört es? **Tom's** bike, mit Apostroph-s." }],
    simplepresent: [{ a: "I play football.", b: "He plays football.", hint: "**He, she, it – das s muss mit!**" }],
    negations: [{ a: "He plays football.", b: "He doesn't play football.", hint: "**doesn't** schnappt sich das s, das Verb bleibt nackt." }],
    adverbsfreq: [{ a: "She plays tennis.", b: "She often plays tennis.", hint: "Häufigkeitswörter stehen **vor** dem Verb." }],
    questions: [{ a: "He plays football.", b: "Does he play football?", hint: "**Does** holt sich das s vom Verb." }],
    presentprog: [{ a: "I read a book.", b: "I am reading a book now.", hint: "Gerade jetzt: **am/is/are** + Verb mit **-ing**." }],
    someany: [{ a: "I've got some apples.", b: "I haven't got any apples.", hint: "Bei Verneinung wird **some** zu **any**." }],
    objectpronouns: [{ a: "I like Tom.", b: "I like him.", hint: "Nach dem Verb: **me, you, him, her, it, us, them**." }],
    wordorder: [{ a: "On Saturday I play football.", b: "I play football on Saturday.", hint: "**S – V – O**: Subjekt, Verb, Objekt. Ort und Zeit kommen ans Ende." }],
    simplepast: [{ a: "I play football.", b: "Yesterday I played football.", hint: "Vorbei? Dann kommt **-ed** dran." }],
    presentperfect: [{ a: "I see that film.", b: "I have seen that film.", hint: "**have/has** + 3. Form." }],
    goingto: [{ a: "I visit Grandma.", b: "I am going to visit Grandma.", hint: "Geplant: **am/is/are going to** + Verb." }],
    will: [{ a: "It rains.", b: "It will rain tomorrow.", hint: "Vorhersage: **will** + Verb ohne -s." }],
    comparison: [{ a: "Tom is tall.", b: "Tom is taller than Ben.", hint: "Vergleich: **-er** + **than**." }],
    if12: [
      { a: "If it rains, I will stay at home.", b: "If it rained, I would stay at home.", hint: "Typ 1 wird zu Typ 2: **eine Zeit zurück**, aus will wird **would**." },
      { a: "If I am rich,", b: "If I were rich,", hint: "Unwirklich? Dann **If I were**, auch bei I und he/she/it." }
    ],
    if3: [{ a: "If it rained, I would stay at home.", b: "If it had rained, I would have stayed at home.", hint: "Typ 3 geht noch eine Zeit zurück: **had** + 3. Form, **would have** + 3. Form." }]
  };
  const topics = window.GRAMMAR.Englisch.topics;
  topics.forEach(t => { if (A[t.id]) t.anim = A[t.id]; });
  const put = (id, extra) => Object.assign(topics.find(t => t.id === id), extra);
  put("if12", {
    explain: [
      "**Typ 1 – wirklich möglich:** If + simple present, dann **will** + Verb. If it rains, I will stay at home.",
      "**Typ 2 – unwahrscheinlich oder ausgedacht:** If + simple past, dann **would** + Verb. If I had a million euros, I would buy an island.",
      "Merksatz: **Im if-Teil steht nie will oder would.**",
      "Bei Typ 2 sagt man oft **If I were** statt If I was, besonders in „If I were you, …“ (An deiner Stelle …)."
    ],
    ex: [["If you **hurry**, you **will catch** the bus.", "Wenn du dich beeilst, erwischst du den Bus."], ["If I **were** you, I **would call** her.", "An deiner Stelle würde ich sie anrufen."], ["If we **lived** by the sea, we **would go** swimming every day.", "Wenn wir am Meer wohnten, gingen wir jeden Tag schwimmen."]],
    tasks: [
      ["gap", "If it ___ tomorrow, we will cancel the trip. (rain)", "rains", "Typ 1: Im if-Teil steht simple present, nicht will.", ["will rain", "rain"]],
      ["pick", "If I ___ you, I would apologise.", ["were", "am", "would be"], "Typ 2 mit be: If I were you."],
      ["gap", "If she had more time, she ___ a novel. (write)", "would write", "Typ 2: had (simple past) im if-Teil, would + Verb im Hauptsatz.", ["will write", "wrote"]],
      ["pick", "We'll miss the train unless we ___.", ["hurry", "will hurry", "hurried"], "unless = if not, auch hier kein will."],
      ["pick", "If you heat ice, it ___.", ["melts", "would melt", "will have melted"], "Naturgesetz: if + present, present (Typ 0)."],
      ["gap", "If he ___ harder, he would pass. (study)", "studied", "Typ 2: simple past im if-Teil.", ["would study", "studies"]],
      ["order", "I would travel the world if I won the lottery.", "Der if-Teil darf auch hinten stehen, dann ohne Komma."],
      ["pick", "If I ___ the answer, I'd tell you – but I don't.", ["knew", "know", "would know"], "Unwirklich in der Gegenwart: Typ 2, also knew."]
    ]
  });
  put("if3", {
    explain: [
      "**Typ 3 – vorbei, nicht mehr zu ändern:** If + **had** + 3. Form, dann **would have** + 3. Form.",
      "If I had known, I would have come. (Hätte ich es gewusst, wäre ich gekommen.)",
      "Gemischt: Vergangenheit wirkt bis heute. If I had slept more, I **would be** less tired now."
    ],
    ex: [["If we **had left** earlier, we **would have caught** the train.", "Wären wir früher losgefahren, hätten wir den Zug erwischt."], ["If she **hadn't helped** me, I **would have failed**.", "Hätte sie mir nicht geholfen, wäre ich durchgefallen."]],
    tasks: [
      ["gap", "If I ___ about the party, I would have come. (know)", "had known", "Typ 3: had + 3. Form im if-Teil.", ["knew", "would have known"]],
      ["pick", "If they had trained more, they ___ the match.", ["would have won", "would win", "had won"], "Typ 3 im Hauptsatz: would have + 3. Form."],
      ["pick", "If I had gone to bed earlier, I ___ so tired now.", ["wouldn't be", "wouldn't have been", "won't be"], "Gemischt: früher (Typ 3) mit Folge jetzt (now), also would be."],
      ["gap", "She would have called if she ___ your number. (have)", "had had", "had + 3. Form von have = had had.", ["would have", "has had"]],
      ["order", "If you had asked me, I would have helped you.", "Typ 3: had asked, would have helped."]
    ]
  });
})();

// Vergleich mit dem Deutschen: steht vor der Erklärung. Wie sagen wir es? Wo ist Englisch anders? Typischer Fehler.
(function () {
  const V = {
    plural: [
      "Im Deutschen gibt es viele Arten, die Mehrzahl zu bilden: Buch → Büch**er**, Katze → Katze**n**, Tisch → Tisch**e**, Auto → Auto**s**.",
      "Im Englischen ist es viel einfacher: Fast immer kommt nur **-s** dazu. book → book**s**, cat → cat**s**.",
      "Aufpassen bei Wörtern, die schon unregelmäßig sind: Wie bei uns Mann → **Männer** gibt es man → **men**. Falsch ist ~~mans~~."
    ],
    articles: [
      "Im Deutschen gibt es drei Artikel für „der, die, das“ und viele Formen (den, dem, des …). Im Englischen gibt es nur **the**, für alles.",
      "Für „ein, eine“ gibt es nur **a**, und **an** vor einem Vokal-Laut: a dog, an apple. Das hängt vom Klang ab, nicht vom Wort.",
      "Anders als im Deutschen steht bei Berufen **a**: Meine Mutter ist Ärztin. → My mum is **a** doctor. Falsch ist ~~My mum is doctor.~~"
    ],
    tobe: [
      "Das Verb „sein“ heißt **to be**. Wie bei uns (ich bin, du bist, er ist) ändert es sich je nach Person: I **am**, you **are**, he/she/it **is**.",
      "Englisch hat nur **you** für „du“ und „ihr“ und auch für „Sie“. Es gibt keinen Unterschied zwischen du und Sie.",
      "**it** benutzt man für Dinge und Tiere, auch wenn es im Deutschen „der“ oder „die“ heißt: Der Tisch ist groß. → **It** is big. Falsch ist ~~He is big.~~"
    ],
    bequestions: [
      "Wie im Deutschen tauschen bei der Frage Verb und Person die Plätze: Du bist zwölf. → **Bist du** zwölf? / You are twelve. → **Are you** twelve?",
      "Das funktioniert im Englischen nur mit am, is, are (und can, have got). Bei anderen Verben braucht man do/does, das kommt später.",
      "Fragewörter stehen wie bei uns vorne: **Wo** bist du? → **Where** are you?"
    ],
    thereis: [
      "„Es gibt“ heißt nicht ~~It gives~~! Englisch sagt **there is** (eins) und **there are** (mehrere).",
      "Im Deutschen ist „es gibt“ immer gleich: Es gibt einen Hund. Es gibt zwei Hunde. Im Englischen ändert sich das Verb: There **is** a dog. There **are** two dogs.",
      "Frage: Gibt es …? → **Is there** …? / **Are there** …?"
    ],
    prepositions: [
      "Viele Ortswörter passen eins zu eins: in → **in**, auf → **on**, unter → **under**, hinter → **behind**, neben → **next to**.",
      "Aber: „zwischen“ heißt **between**, „vor“ heißt **in front of**, und „gegenüber“ heißt **opposite**.",
      "Falsche Freunde: „bei“ ist nicht ~~by~~, sondern oft **at**: bei Oma → **at** Grandma's. Und **at** home heißt zu Hause."
    ],
    possessives: [
      "„sein“ und „ihr“ heißen wie im Deutschen je nach Besitzer verschieden: Tom und **sein** Hund → Tom and **his** dog, Lisa und **ihr** Hund → Lisa and **her** dog.",
      "Aber das Englische ändert sich **nicht** nach dem Ding, das man besitzt: mein Hund, meine Katze, meine Bücher → **my** dog, **my** cat, **my** books.",
      "Achtung bei „ihr“: ihr (Lisas) → **her**, ihr (von mehreren) → **their**, Ihr (höflich) → **your**."
    ],
    commands: [
      "Bei uns sagt man „Mach die Tür zu!“ oder „Macht die Tür zu!“. Im Englischen gibt es nur eine Form: **Close** the door! Das Verb steht ohne Person vorne.",
      "Verbot: Im Deutschen „Fass das nicht an!“, das „nicht“ steht hinten. Im Englischen steht **Don't** vorne: **Don't** touch it! Falsch ist ~~Touch it not!~~",
      "Höflich wird es mit **please**: Please sit down. (Setz dich bitte.)"
    ],
    can: [
      "**can** heißt „können“ und manchmal auch „dürfen“: Can I go out? (Darf ich rausgehen?)",
      "Anders als im Deutschen ändert sich can nie: ich kann, er kann → I **can**, he **can**. Falsch ist ~~he cans~~.",
      "Das Verb danach steht ohne to und ohne -s, gleich nach can: She can **swim**. Im Deutschen steht es am Ende: Sie kann **schwimmen**."
    ],
    havegot: [
      "„Ich habe einen Hund“ heißt in Großbritannien meist **I have got** a dog (kurz: I've got).",
      "Wie bei „ich habe, er hat“ ändert sich die Form: I **have got**, he/she/it **has got**.",
      "Frage und Verneinung gehen mit have selbst, nicht mit do: **Have** you **got** a pet? I **haven't got** a pet."
    ],
    genitive: [
      "Wir sagen „Toms Fahrrad“ oder „das Fahrrad von Tom“. Englisch sagt fast immer **Tom's** bike, mit Apostroph vor dem s.",
      "Im Deutschen schreibt man „Toms“ ohne Apostroph. Im Englischen gehört er dazu: Tom**'s**.",
      "Mehrere Besitzer mit -s: Der Apostroph kommt hinten dran: my parents**'** car (das Auto meiner Eltern)."
    ],
    simplepresent: [
      "**Gibt es das im Deutschen?** Ja, das ist unser **Präsens**: ich spiele, du spielst, er spielt. Gebaut wird es wie bei uns aus nur **einem** Wort.",
      "**Der große Unterschied:** Unser Präsens kann alles. „Ich spiele Fußball“ kann heißen: jeden Samstag, gerade jetzt oder sogar morgen. Englisch teilt das auf. Das simple present steht nur für **immer wieder, normalerweise** und für **Tatsachen**: I play football every Saturday. Cats like milk.",
      "**Endungen:** Wir haben viele (spiel**e**, spiel**st**, spiel**t**, spiel**en**). Englisch hat nur eine einzige: **-s bei he, she, it**. Wo wir „er spiel**t**“ sagen, sagt Englisch „he play**s**“.",
      "Typische Fehler: ~~He play football.~~ (das s fehlt) und ~~I am play football every day.~~ (am gehört hier nicht hin)."
    ],
    negations: [
      "Im Deutschen hängt man einfach „nicht“ an: Ich spiele **nicht**. Im Englischen braucht man ein Hilfsverb: I **don't** play. Falsch ist ~~I play not.~~",
      "Bei he, she, it heißt es **doesn't**, und das Verb verliert sein -s: He **doesn't** play. Falsch ist ~~He doesn't plays.~~",
      "Bei am, is, are und can braucht man kein don't: I'm **not** tired. She **can't** swim."
    ],
    adverbsfreq: [
      "Im Deutschen steht „oft“ meist nach dem Verb: Sie spielt **oft** Tennis. Im Englischen steht es **davor**: She **often** plays tennis.",
      "Nur bei am, is, are steht es dahinter, fast wie im Deutschen: She is **never** late.",
      "Orts- und Zeitangaben stehen im Englischen meistens am Satzende: I play football **in the park on Saturday**."
    ],
    shortanswers: [
      "Im Deutschen reicht oft ein „Ja“ oder „Nein“. Im Englischen klingt nur „Yes“ oder „No“ unhöflich kurz.",
      "Man wiederholt das Hilfsverb aus der Frage: **Are** you ready? – Yes, I **am**. **Can** you swim? – No, I **can't**.",
      "Falsch ist ~~Yes, I swim.~~ oder ~~Yes, I'm.~~ Bei Ja steht am Ende keine Kurzform."
    ],
    questions: [
      "Im Deutschen tauschen wir einfach: Du spielst. → **Spielst du**? Im Englischen geht das bei normalen Verben nicht. Falsch ist ~~Play you football?~~",
      "Man braucht **do** oder **does** vorne: **Do** you play football? **Does** he play football?",
      "Bei does verliert das Verb sein -s: Does he **play**? Fragewörter kommen davor: **Where does** she live?"
    ],
    presentprog: [
      "**Gibt es das im Deutschen?** Nicht als eigene Zeit. Wir sagen „Ich lese“ und hängen höchstens „gerade“ an. Aber in manchen Gegenden sagt man „**Ich bin am Lesen**“, und genau so ist das Englische gebaut!",
      "**So baust du es mit dem Deutschen:** Ich **bin** am **Lesen** → I **am** read**ing**. „bin“ wird zu **am/is/are**, „am Lesen“ wird zu **Verb + -ing**.",
      "**Wann?** Nur für das, was **jetzt gerade** läuft oder nur für kurze Zeit so ist. Für „immer wieder“ nimmst du das simple present: I **play** football every Saturday. Look, I**'m playing** football now!",
      "Typische Fehler: ~~I reading.~~ (am fehlt) und ~~I am read.~~ (-ing fehlt). Du brauchst immer **beides**."
    ],
    someany: [
      "Im Deutschen sagen wir oft gar nichts: Ich habe Äpfel. Haben wir Milch? Im Englischen sagt man meist **some** oder **any** dazu.",
      "**some** steht in normalen Sätzen und in Bitten: I've got **some** apples. Would you like **some** juice?",
      "**any** steht in Fragen und mit not: Have you got **any** milk? I haven't got **any** milk. (Ich habe keine Milch.)"
    ],
    conjunctions: [
      "Die Wörter passen gut zum Deutschen: und → **and**, aber → **but**, oder → **or**, weil → **because**, also → **so**.",
      "Großer Unterschied: Im Deutschen rutscht das Verb nach „weil“ ans Ende (weil ich müde **bin**). Im Englischen bleibt alles normal: because I **am** tired.",
      "Falscher Freund: Das deutsche „also“ heißt **so**. Das englische also heißt „auch“."
    ],
    objectpronouns: [
      "Im Deutschen gibt es mich und mir, dich und dir, ihn und ihm. Englisch hat nur **eine** Form: me, you, him, her, it, us, them.",
      "Hilf **mir**! und Sieh **mich** an! → Help **me**! Look at **me**!",
      "Falsch ist ~~I like he.~~ Nach dem Verb steht die Objektform: I like **him**."
    ],
    modals: [
      "**must** heißt „müssen“: You **must** go now.",
      "Achtung, falscher Freund: **mustn't** heißt nicht „nicht müssen“, sondern „**nicht dürfen**“: You **mustn't** run here. (Du darfst hier nicht rennen.)",
      "**should** heißt „sollte“, **shouldn't** heißt „sollte nicht“. Wie bei can steht danach das Verb ohne to und ohne -s."
    ],
    wordorder: [
      "Im Deutschen darf vieles vorne stehen, dann rutscht die Person hinter das Verb: **Heute spiele ich** Fußball.",
      "Im Englischen bleibt die Reihenfolge immer gleich: **S**ubjekt – **V**erb – **O**bjekt. **Today I play** football. Falsch ist ~~Today play I football.~~",
      "Auch nach because bleibt es so (deutsch: weil er lustig **ist**, englisch: because he **is** funny). Ort kommt vor Zeit: in the park after school."
    ],
    thisthat: [
      "Im Deutschen sagen wir „dieser hier“ und „der dort“. Englisch hat dafür eigene Wörter: **this** (hier) und **that** (dort).",
      "Anders als im Deutschen haben sie eine Mehrzahl: this → **these**, that → **those**.",
      "Typischer Fehler: ~~this shoes~~. Mehrere Dinge, also **these** shoes."
    ],
    simplepast: [
      "**Gibt es das im Deutschen?** Ja, das ist unser **Präteritum**: ich spiel**te**, ich **ging**. Gebaut wird es fast wie bei uns, aus einem Wort: Regelmäßig mit Endung (spiel**te** → play**ed**), unregelmäßig mit einem neuen Wort (ging → **went**, sah → **saw**).",
      "**Der große Unterschied:** Wenn wir erzählen, sagen wir meist das Perfekt: Ich **habe** gestern Fußball **gespielt**. Englisch nimmt dafür das simple past: Yesterday I **played** football.",
      "**Merke:** Steht eine Zeit in der Vergangenheit dabei (yesterday, last week, two days ago, in 2020), dann nimmst du **immer** das simple past.",
      "**Fragen und Verneinung:** Wir sagen „Spieltest du?“ und „Ich spielte nicht“. Englisch braucht **did**: **Did** you play? I **didn't** play. Das Verb steht danach in der Grundform, weil did die Vergangenheit schon trägt.",
      "Typische Fehler: ~~Did you played?~~ und ~~Yesterday I have played.~~"
    ],
    countable: [
      "Manche Wörter haben im Deutschen eine Mehrzahl, im Englischen aber nicht: die Informationen → **information**, die Hausaufgaben → **homework**, Ratschläge → **advice**, Möbel → **furniture**.",
      "Diese Wörter bekommen kein -s und kein a/an, und das Verb steht in der Einzahl: My homework **is** easy.",
      "Wenn man doch zählen will, sagt man wie im Deutschen **a piece of** (ein Stück), **a glass of** (ein Glas)."
    ],
    quantifiers: [
      "Im Deutschen sagen wir „viel“ zu allem: viel Geld, viele Freunde. Englisch unterscheidet: **much** money (nicht zählbar), **many** friends (zählbar).",
      "Genauso bei „ein bisschen“ und „ein paar“: **a little** milk, **a few** friends.",
      "Ein einfacher Ausweg in normalen Sätzen: **a lot of** passt zu allem."
    ],
    presentperfect: [
      "**Gibt es das im Deutschen?** Gebaut ja: Es sieht aus wie unser **Perfekt** mit „haben“ und Partizip. Ich **habe** ge**gessen** → I **have eaten**. Das Partizip (gegessen) ist die **3. Form** in der Verbtabelle.",
      "**Unterschied beim Bauen:** Wir nehmen „haben“ oder „sein“ (ich habe gegessen, ich **bin** gegangen). Englisch nimmt **immer have**: I **have** gone. Falsch ist ~~I am gone.~~",
      "**Unterschied bei der Bedeutung, das Wichtigste:** Wir benutzen das Perfekt für fast jede Vergangenheit. Englisch nur, wenn das **Wann egal** ist und es mit **jetzt** zu tun hat: I have lost my key. (Er ist jetzt noch weg.) Sobald eine Zeit dabeisteht, nimmst du das simple past: I **lost** it yesterday.",
      "**Und bei „seit“:** Wir sagen „Ich **wohne** seit 2020 hier“, also Präsens. Englisch nimmt das present perfect, weil es bis jetzt andauert: I **have lived** here **since** 2020.",
      "Typische Fehler: ~~I have seen it yesterday.~~ und ~~I live here since 2020.~~"
    ],
    goingto: [
      "**Gibt es das im Deutschen?** So ähnlich: „Ich **habe vor**, Oma zu besuchen.“ Meistens sagen wir aber einfach das Präsens: Morgen **besuche** ich Oma. Das geht im Englischen nicht, dort braucht die Zukunft eine Zukunftsform.",
      "**So baust du es:** Für Pläne nimmst du **am/is/are + going to + Grundform**: I**'m going to** visit Grandma. Stell dir vor: Ich bin schon auf dem Weg dahin, ich habe es fest vor.",
      "**Wie unser „gleich“:** Wenn man etwas schon kommen sieht: Es regnet **gleich**. → It**'s going to** rain.",
      "Typische Fehler: ~~Tomorrow I visit Grandma.~~ (für einen Plan) und ~~I going to visit …~~ (am fehlt)."
    ],
    will: [
      "**Gibt es das im Deutschen?** Ja, das ist unser **Futur** mit „werden“: Ich **werde** kommen → I **will** come. Gebaut wird es genauso: **will + Grundform**.",
      "**Unterschiede beim Bauen:** „werden“ ändert sich (werde, wirst, wird), will nie: I will, he will. Und das Verb kommt im Englischen **direkt** nach will, nicht ans Ende: Ich werde morgen **kommen**. → I will **come** tomorrow.",
      "**Achtung, falscher Freund:** I will heißt **nicht** „ich will“! Ich will ein Eis. → I **want** an ice cream.",
      "**Unterschied beim Benutzen:** Wir lassen „werden“ oft weg: Ich ruf dich später an. Englisch nicht: I**'ll** call you later."
    ],
    comparison: [
      "Kurze Wörter steigert man wie im Deutschen mit Endungen: klein, klein**er**, am klein**sten** → small, small**er**, the small**est**.",
      "Lange Wörter bekommen im Englischen **more** und **most**: interessanter → **more** interesting. Falsch ist ~~interestinger~~.",
      "„als“ heißt beim Vergleich **than**, nicht ~~as~~ und nicht ~~then~~: größer **als** → bigger **than**. „so groß wie“ → **as** big **as**."
    ],
    adverbsmanner: [
      "Im Deutschen sagt man „Sie ist leise“ und „Sie spricht leise“, beides mit demselben Wort.",
      "Englisch unterscheidet: She is **quiet**. (wie sie ist) She speaks **quietly**. (wie sie es tut, mit **-ly**)",
      "Typischer Fehler: ~~He plays good.~~ Wie spielt er? Gut → **well**: He plays **well**."
    ],
    if12: [
      "**Gibt es das im Deutschen?** Ja, beide. Typ 1 ist wie bei uns: **Wenn** es regnet, bleibe ich zu Hause. → If it **rains**, I **will stay** at home. Das kann wirklich passieren.",
      "Typ 2 ist unser **Konjunktiv** mit „würde“, „wäre“, „hätte“: **Wenn** ich reich **wäre**, **würde** ich eine Insel kaufen. → If I **were** rich, I **would** buy an island. Es ist nur ausgedacht.",
      "**So baust du Typ 2 mit dem Deutschen:** Unser „hätte“ sieht aus wie „hatte“ (Vergangenheit). Englisch macht es genauso: Im if-Teil steht die **Vergangenheitsform** (If I **had**, If I **were**), im anderen Teil steht **would** (= würde).",
      "Typischer Fehler: Wie im Deutschen ein „würde“ in den if-Teil setzen. Falsch ist ~~If I would have money~~. Im if-Teil steht nie will oder would."
    ],
    if3: [
      "Typ 3 ist unser „hätte“ und „wäre“ in der Vergangenheit: **Wenn** ich gelernt **hätte**, **hätte** ich bestanden. → If I **had learned**, I **would have passed**.",
      "Wann? Wenn etwas **schon vorbei** ist und **nicht passiert ist**. Man stellt sich vor, wie es anders hätte kommen können, oft wenn man etwas bedauert. In echt habe ich nicht gelernt und bin durchgefallen.",
      "Warum diese Form? Englisch geht beim Unwirklichen immer eine Zeit zurück: Typ 1 if it **rains** → Typ 2 if it **rained** → Typ 3 if it **had rained**.",
      "Typischer Fehler: Weil im Deutschen zweimal „hätte“ steht, schreiben viele ~~If I would have known~~. Im if-Teil steht nie would: If I **had** known, I **would have** come."
    ]
  };
  // Ausnahmen: eigener Kasten nach der Erklärung
  const AUS = {
    plural: [
      "Wörter auf **-f** oder **-fe** werden oft zu **-ves**: knife → kni**ves**, wife → wi**ves**, leaf → lea**ves**, half → hal**ves**. Aber: roof → roof**s**.",
      "Bei Wörtern auf **-o** gibt es beides: tomato → tomato**es**, potato → potato**es**, aber photo → photo**s**, piano → piano**s**.",
      "Unregelmäßig, zum Auswendiglernen: man → **men**, woman → **women**, child → **children**, foot → **feet**, tooth → **teeth**, mouse → **mice**, person → **people**.",
      "In Einzahl und Mehrzahl gleich: one **sheep**, two **sheep**. Genauso: **fish**, **deer**.",
      "Nur in der Mehrzahl, auch wenn es ein Ding ist: **trousers**, **jeans**, **shorts**, **glasses** (Brille), **scissors** (Schere). My jeans **are** new."
    ],
    articles: [
      "Es zählt der **Laut**, nicht der Buchstabe! **a university** spricht man „ju-ni-wör-si-ti“. Das „ju“ beginnt mit dem j-Laut wie in „Jacke“, und j ist ein Konsonant. Darum **a** university, **a** uniform, **a** European.",
      "Genauso **a one-way ticket**: one spricht man „wan“, also mit w-Laut.",
      "Umgekehrt: **an hour**, **an honest** girl. Das h spricht man hier nicht, das Wort beginnt also mit einem Vokal-Laut. Aber: **a h**orse, **a h**ouse, denn dort hört man das h.",
      "Bei Abkürzungen auch nach dem Laut: **an** MP3 player (gesprochen „em“), aber **a** USB stick (gesprochen „ju“).",
      "Ohne Artikel, anders als im Deutschen: I go to **school** / to **bed**. I'm at **home**. I play **football**. Aber Instrumente mit the: I play **the** piano."
    ],
    tobe: [
      "**you** ist Einzahl und Mehrzahl, und es heißt immer **are**: You **are** my friend. You **are** my friends.",
      "Verneint bei I gibt es keine Kurzform mit am: I**'m not** tired. Falsch ist ~~I amn't~~.",
      "Haustiere nennt man oft **he** oder **she** statt it, wenn man sie kennt: Our dog is great. **He** loves balls."
    ],
    bequestions: [
      "Kurzantwort mit Yes ohne Kurzform: Yes, I **am**. Yes, she **is**. Falsch ist ~~Yes, I'm.~~",
      "Bei Fragen nach dem Alter: **How old are you?** Antwort: I'm twelve. Nicht ~~I have twelve years.~~"
    ],
    thereis: [
      "Bei einer Aufzählung zählt das **erste** Ding: There **is** a pen and two books on the desk. There **are** two books and a pen on the desk.",
      "Es gibt die Kurzform **there's**, aber für there are schreibt man meist keine Kurzform."
    ],
    prepositions: [
      "Anders als im Deutschen: **in** the picture (**auf** dem Bild), **on** the bus / **on** the train (**im** Bus), aber **in** the car.",
      "**at** für feste Orte: **at** school, **at** home, **at** the station, **at** Grandma's.",
      "**on** the left / **on** the right (links, rechts), **on** the first floor."
    ],
    possessives: [
      "**its** (sein bei Dingen und Tieren) hat **keinen** Apostroph. **it's** heißt it is.",
      "Bei Körperteilen und Kleidung nimmt Englisch den Possessivbegleiter, wo wir „die“ sagen: Ich wasche mir **die** Hände. → I wash **my** hands. Er zieht **die** Jacke an. → He puts on **his** jacket."
    ],
    commands: [
      "Auch bei be braucht man Don't: **Don't be** sad! Falsch ist ~~Be not sad!~~",
      "Ein Vorschlag mit **Let's** (lass uns): **Let's** go! Verneint: **Let's not** go."
    ],
    can: [
      "**cannot** schreibt man zusammen, kurz **can't**.",
      "Vergangenheit von can ist **could**: When I was five, I **could** swim. (konnte)",
      "can hat keine Zukunft und keine to-Form. Dafür sagt man **be able to**: I**'ll be able to** come."
    ],
    havegot: [
      "have got gibt es nur in der **Gegenwart**. Vergangenheit meist ohne got: I **had** a dog. (Ich hatte einen Hund.)",
      "Bei Tätigkeiten heißt es **have** ohne got: **have** breakfast, **have** a shower, **have** fun, **have** a party. Falsch ist ~~I've got breakfast at seven.~~"
    ],
    genitive: [
      "Namen auf -s: Beides geht: **James's** bike oder **James'** bike.",
      "**at Grandma's** heißt „bei Oma zu Hause“, das Wort house fällt weg. Genauso: at the doctor's (beim Arzt).",
      "Auch bei Zeit: **today's** lesson (die Stunde von heute)."
    ],
    simplepresent: [
      "Nach **s, sh, ch, x** und **o** kommt **-es**: watch → watch**es**, go → go**es**, do → do**es**.",
      "Konsonant + y wird zu **-ies**: fly → fl**ies**. Aber Vokal + y nur **-s**: play → play**s**.",
      "Ganz unregelmäßig: have → **has**, be → **am/is/are**.",
      "Bei can, must, should gibt es **nie** ein -s: She **can** swim."
    ],
    negations: [
      "Bei be, can und have got brauchst du kein do: I'm **not** …, She **can't** …, We **haven't got** …",
      "Nur **eine** Verneinung pro Satz: I **never** eat fish. Falsch ist ~~I don't never eat fish.~~ Genauso: I've got **no** money = I haven't got **any** money."
    ],
    adverbsfreq: [
      "**sometimes** darf auch ganz vorne oder hinten stehen: **Sometimes** I walk to school.",
      "Bei Hilfsverb + Verb steht es dazwischen: I **can never** remember it. She **has always** liked cats."
    ],
    shortanswers: [
      "Bei have got: **Have** you got a pet? – Yes, I **have**. / No, I **haven't**. (ohne got)",
      "Bei Fragen mit Fragewort (Where, What …) gibt es keine Kurzantwort mit Yes/No."
    ],
    questions: [
      "Fragst du nach dem **Subjekt** (wer oder was tut etwas?), brauchst du **kein** do: **Who lives** here? **What happened**? Falsch ist ~~Who does live here?~~",
      "Bei be, can und have got kein do: **Are** you …? **Can** you …? **Have** you got …?"
    ],
    presentprog: [
      "Manche Verben beschreiben keinen Vorgang, sondern einen **Zustand**. Sie stehen fast nie mit -ing: **like, love, hate, want, need, know, believe, understand**. I **like** this song. Falsch ist ~~I'm liking this song.~~",
      "Schreibung: **-ie** wird zu **-ying**: lie → l**ying**, die → d**ying**.",
      "Britisches Englisch verdoppelt das l: travel → trave**ll**ing."
    ],
    someany: [
      "**any** in bejahten Sätzen heißt „egal welche“: You can take **any** book.",
      "**no** = not any: I've got **no** money = I haven't got **any** money."
    ],
    conjunctions: [
      "Steht der because-Teil vorne, kommt ein Komma: **Because** it was raining, we stayed at home.",
      "Vor **so** steht meist ein Komma, vor because meist nicht: I'm tired**,** so I go to bed. I go to bed because I'm tired."
    ],
    objectpronouns: [
      "Nach **than** und **as** sagt man meist die Objektform: She is taller **than me**.",
      "Ich bin's! → **It's me!** (nicht ~~It's I~~)"
    ],
    modals: [
      "must hat **keine Vergangenheit**. Dafür nimmt man **had to**: Yesterday I **had to** go to the dentist.",
      "„muss nicht“ heißt **don't have to** oder **needn't**: You **don't have to** come. (Du musst nicht kommen.) Nicht verwechseln mit mustn't!"
    ],
    wordorder: [
      "Die Zeitangabe darf auch **ganz vorne** stehen, dann kommt trotzdem zuerst das Subjekt: **On Saturday I play** football.",
      "In Fragen tauschen sich Hilfsverb und Subjekt: **Do you** like it? **Are you** ready?",
      "Häufigkeitswörter stehen vor dem Verb in der Mitte: I **always** play."
    ],
    thisthat: [
      "**this morning** = heute Morgen, **this week** = diese Woche.",
      "Am Telefon: **This is** Tom. (Hier ist Tom.)"
    ],
    simplepast: [
      "Schreibung: **-e** bekommt nur **-d**: live → live**d**. Kurzer Vokal + ein Konsonant: verdoppeln: stop → sto**pp**ed. Konsonant + y: **-ied**: cry → cr**ied**. Aber Vokal + y: play → play**ed**.",
      "Britisches Englisch verdoppelt das l: travel → trave**ll**ed.",
      "Manche unregelmäßigen Verben bleiben gleich: put → **put**, cut → **cut**, let → **let**, hit → **hit**.",
      "Bei be gibt es zwei Formen: I/he/she/it **was**, you/we/they **were**."
    ],
    countable: [
      "**hair** ist nicht zählbar: My hair **is** long. (Meine Haare sind lang.)",
      "**news** endet auf -s, ist aber Einzahl: The news **is** good.",
      "Manches geht beides: **coffee** (Kaffee allgemein) und **a coffee** (eine Tasse Kaffee). Genauso: chocolate und **a chocolate** (eine Praline)."
    ],
    quantifiers: [
      "**a few** = ein paar (gut so), **few** ohne a = wenige (zu wenig): I've got **a few** friends. – He has **few** friends. (Er hat kaum Freunde.)",
      "Genauso **a little** (ein bisschen) und **little** (kaum).",
      "In bejahten Sätzen klingt **much** oft steif. Man sagt eher **a lot of**: I've got **a lot of** time."
    ],
    presentperfect: [
      "**been** oder **gone**? She has **gone** to London. = Sie ist hingefahren und jetzt noch dort. She has **been** to London. = Sie war schon mal dort und ist wieder da.",
      "**since** steht vor einem Zeitpunkt (since Monday, since 2020), **for** vor einer Zeitspanne (for two weeks).",
      "**already** steht in der Mitte, **yet** am Ende: I've **already** finished. Have you finished **yet**?"
    ],
    goingto: [
      "Bei **go** sagt man trotzdem going to **go**: I'm going to go to the cinema. Kürzer geht auch: I'm going to the cinema.",
      "Für feste Verabredungen nimmt man oft das present progressive: I**'m meeting** Tom tomorrow.",
      "Für Fahrpläne das simple present: The train **leaves** at eight."
    ],
    will: [
      "Bei Vorschlägen mit I und we sagt man **Shall**: **Shall** we go? **Shall** I help you?",
      "Nach **when** und **if** steht kein will, auch wenn es um die Zukunft geht: **When** I **am** older, I'll be a vet. Falsch ist ~~When I will be older~~."
    ],
    comparison: [
      "Doppelt bei kurzem Vokal: big → bi**gg**er, hot → ho**tt**er. Stummes e: nice → nice**r**.",
      "Zweisilbig auf -y mit -er: happy → happ**ier**, easy → eas**ier**. Andere zweisilbige meist mit more: **more** boring, **more** famous.",
      "Unregelmäßig: good → **better** → **best**, bad → **worse** → **worst**, many/much → **more** → **most**, little → **less** → **least**, far → **further** → **furthest**."
    ],
    adverbsmanner: [
      "Schon auf -ly und doch Adjektive: **friendly, lovely, lonely, silly**. Davon gibt es kein Adverb, man sagt: in a friendly **way**.",
      "**hard** bleibt hard, **hardly** heißt etwas anderes: kaum. Genauso **late** (spät) und **lately** (in letzter Zeit).",
      "Nach **be, look, feel, sound, taste** steht das Adjektiv: You **look happy**. It **tastes good**."
    ],
    if12: [
      "Steht der if-Teil **hinten**, gibt es kein Komma: I'll stay at home **if** it rains.",
      "**unless** = if not: I'll be late **unless** I hurry.",
      "**if** oder **when**? when = wenn es sicher passiert: **When** I get home, I'll call you. if = falls: **If** I have time, I'll call you."
    ],
    if3: [
      "Kurzform **'d** kann **had** oder **would** sein: If I**'d** (had) known, I**'d** (would) have come.",
      "Statt would have geht auch **could have** (hätte können) oder **might have** (hätte vielleicht): If you had asked, I **could have** helped."
    ]
  };
  // Beispiele zum Vergleich: [englisch, deutsch]
  const E = {
    plural: [["one book, two **books**", "ein Buch, zwei Büch**er**"], ["one cat, three **cats**", "eine Katze, drei Katze**n**"], ["one man, two **men**", "ein Mann, zwei **Männer**"], ["one child, four **children**", "ein Kind, vier Kind**er**"]],
    articles: [["**the** dog, **the** cat, **the** house", "**der** Hund, **die** Katze, **das** Haus"], ["**a** banana, **an** apple", "**eine** Banane, **ein** Apfel"], ["My dad is **a** teacher.", "Mein Vater ist Lehrer."], ["I give **the** dog **the** ball.", "Ich gebe **dem** Hund **den** Ball."]],
    tobe: [["I **am** twelve.", "Ich **bin** zwölf."], ["You **are** my friend. / You **are** my friends.", "Du **bist** mein Freund. / Ihr **seid** meine Freunde."], ["Where is the ball? – **It** is under the bed.", "Wo ist der Ball? – **Er** ist unter dem Bett."], ["We **are** at school.", "Wir **sind** in der Schule."]],
    bequestions: [["**Are you** twelve?", "**Bist du** zwölf?"], ["**Is she** your sister?", "**Ist sie** deine Schwester?"], ["Where **are you**?", "Wo **bist du**?"], ["**Is it** cold today?", "**Ist es** heute kalt?"]],
    thereis: [["**There is** a dog in the garden.", "**Es gibt** einen Hund im Garten. / Im Garten ist ein Hund."], ["**There are** two dogs in the garden.", "**Es gibt** zwei Hunde im Garten."], ["**Is there** a park near your house?", "**Gibt es** einen Park in der Nähe von deinem Haus?"], ["**There aren't** any shops here.", "Hier **gibt es** keine Läden."]],
    prepositions: [["The cat is **under** the table.", "Die Katze ist **unter** dem Tisch."], ["The bus stop is **in front of** the school.", "Die Bushaltestelle ist **vor** der Schule."], ["I'm **at** Grandma's.", "Ich bin **bei** Oma."], ["The shop is **opposite** the park.", "Der Laden ist **gegenüber** vom Park."]],
    possessives: [["Tom and **his** dog", "Tom und **sein** Hund"], ["Lisa and **her** dog", "Lisa und **ihr** Hund"], ["**my** brother, **my** sister, **my** books", "**mein** Bruder, **meine** Schwester, **meine** Bücher"], ["The children and **their** teacher", "Die Kinder und **ihre** Lehrerin"]],
    commands: [["**Close** the door, please.", "**Mach** bitte die Tür zu. / **Macht** bitte die Tür zu."], ["**Don't touch** the cake!", "**Fass** den Kuchen **nicht an**!"], ["**Sit down**, please.", "**Setz dich** bitte. / **Setzt euch** bitte."], ["**Don't be** late!", "**Sei nicht** zu spät!"]],
    can: [["I **can swim**.", "Ich **kann schwimmen**."], ["She **can play** the guitar.", "Sie **kann** Gitarre **spielen**."], ["**Can** I go out, please?", "**Darf** ich bitte rausgehen?"], ["My brother **can't** ride a bike.", "Mein Bruder **kann nicht** Fahrrad fahren."]],
    havegot: [["I**'ve got** a dog.", "Ich **habe** einen Hund."], ["She **has got** two brothers.", "Sie **hat** zwei Brüder."], ["**Have** you **got** a pencil?", "**Hast** du einen Bleistift?"], ["We **haven't got** a garden.", "Wir **haben keinen** Garten."]],
    genitive: [["**Tom's** bike", "**Toms** Fahrrad / das Fahrrad **von Tom**"], ["**my sister's** room", "das Zimmer **meiner Schwester**"], ["**my parents'** car", "das Auto **meiner Eltern**"], ["**the children's** toys", "die Spielsachen **der Kinder**"]],
    simplepresent: [["I **play** football.", "Ich **spiele** Fußball."], ["He **plays** football.", "Er **spielt** Fußball."], ["We **play** football **every Saturday**.", "Wir **spielen jeden Samstag** Fußball."], ["My mum **works** in a shop.", "Meine Mutter **arbeitet** in einem Laden."]],
    negations: [["I **don't** like fish.", "Ich mag **keinen** Fisch. / Ich mag Fisch **nicht**."], ["He **doesn't** play tennis.", "Er spielt **nicht** Tennis."], ["We **don't** live in London.", "Wir wohnen **nicht** in London."], ["I'm **not** tired.", "Ich bin **nicht** müde."]],
    adverbsfreq: [["She **often** plays tennis.", "Sie spielt **oft** Tennis."], ["I **always** have breakfast at seven.", "Ich frühstücke **immer** um sieben."], ["He is **never** late.", "Er ist **nie** zu spät."], ["We **sometimes** go to the cinema.", "Wir gehen **manchmal** ins Kino."]],
    shortanswers: [["Are you ready? – **Yes, I am.**", "Bist du fertig? – **Ja.**"], ["Can you swim? – **No, I can't.**", "Kannst du schwimmen? – **Nein.**"], ["Do you like pizza? – **Yes, I do.**", "Magst du Pizza? – **Ja.**"], ["Has she got a pet? – **No, she hasn't.**", "Hat sie ein Haustier? – **Nein.**"]],
    questions: [["**Do** you **play** football?", "**Spielst du** Fußball?"], ["**Does** he **like** cats?", "**Mag er** Katzen?"], ["Where **does** she **live**?", "Wo **wohnt sie**?"], ["What **do** you **eat** for breakfast?", "Was **isst du** zum Frühstück?"]],
    presentprog: [["I **am reading** a book.", "Ich **lese gerade** ein Buch."], ["Look! It **is snowing**.", "Schau! Es **schneit**."], ["We **are having** lunch.", "Wir **essen gerade** zu Mittag."], ["What **are** you **doing**?", "Was **machst** du **gerade**?"]],
    someany: [["I've got **some** apples.", "Ich habe (ein paar) Äpfel."], ["Would you like **some** juice?", "Möchtest du (etwas) Saft?"], ["Have you got **any** milk?", "Hast du Milch?"], ["I haven't got **any** milk.", "Ich habe **keine** Milch."]],
    conjunctions: [["I'm happy **because** it **is** my birthday.", "Ich bin froh, **weil** ich Geburtstag **habe**."], ["I'm tired, **so** I go to bed.", "Ich bin müde, **also** gehe ich ins Bett."], ["I like cats, **but** I don't like dogs.", "Ich mag Katzen, **aber** ich mag keine Hunde."], ["Do you want tea **or** juice?", "Möchtest du Tee **oder** Saft?"]],
    objectpronouns: [["Help **me**, please!", "Hilf **mir** bitte!"], ["Look at **me**!", "Schau **mich** an!"], ["I like **him**.", "Ich mag **ihn**."], ["Can you call **us**?", "Kannst du **uns** anrufen?"]],
    modals: [["You **must** go home now.", "Du **musst** jetzt nach Hause gehen."], ["You **mustn't** run here.", "Du **darfst** hier **nicht** rennen."], ["You **should** ask your teacher.", "Du **solltest** deine Lehrerin fragen."], ["You **shouldn't** eat so many sweets.", "Du **solltest nicht** so viele Süßigkeiten essen."]],
    wordorder: [["**Today I play** football.", "**Heute spiele ich** Fußball."], ["**On Saturday we go** to the cinema.", "**Am Samstag gehen wir** ins Kino."], ["I like Tom because **he is** funny.", "Ich mag Tom, weil **er** lustig **ist**."], ["She meets her friends **in the park after school**.", "Sie trifft ihre Freunde **nach der Schule im Park**."]],
    thisthat: [["**This** dog here is mine.", "**Dieser** Hund **hier** ist meiner."], ["Look at **that** house!", "Schau dir **das** Haus **dort** an!"], ["**These** shoes are new.", "**Diese** Schuhe (hier) sind neu."], ["Who are **those** girls?", "Wer sind **die** Mädchen **dort**?"]],
    simplepast: [["Yesterday I **played** football.", "Gestern **habe** ich Fußball **gespielt**."], ["Last summer we **went** to Spain.", "Letzten Sommer **sind** wir nach Spanien **gefahren**."], ["She **saw** a fox in the park.", "Sie **hat** im Park einen Fuchs **gesehen**."], ["**Did** you **like** the film?", "**Hat** dir der Film **gefallen**?"]],
    countable: [["My homework **is** easy.", "Meine Hausaufgaben **sind** leicht."], ["I need some **information**.", "Ich brauche ein paar **Informationen**."], ["Can you give me some **advice**?", "Kannst du mir ein paar **Ratschläge** geben?"], ["Can I have **a piece of** cake?", "Kann ich **ein Stück** Kuchen haben?"]],
    quantifiers: [["How **much** money have you got?", "Wie **viel** Geld hast du?"], ["How **many** friends have you got?", "Wie **viele** Freunde hast du?"], ["Can I have **a little** milk?", "Kann ich **ein bisschen** Milch haben?"], ["I've got **a few** friends in Berlin.", "Ich habe **ein paar** Freunde in Berlin."]],
    presentperfect: [["I **have lost** my key.", "Ich **habe** meinen Schlüssel **verloren**. (Er ist immer noch weg.)"], ["**Have** you ever **been** to London?", "**Warst** du schon einmal in London?"], ["I **lost** my key **yesterday**.", "Ich **habe gestern** meinen Schlüssel **verloren**."], ["She **has** just **finished** her homework.", "Sie **ist** gerade mit den Hausaufgaben **fertig geworden**."]],
    goingto: [["I**'m going to** visit Grandma tomorrow.", "Morgen **besuche** ich Oma."], ["We**'re going to** have a party.", "Wir **wollen** eine Party machen."], ["Look at the clouds! It**'s going to** rain.", "Schau dir die Wolken an! Es **regnet gleich**."], ["What **are** you **going to** do at the weekend?", "Was **machst** du am Wochenende?"]],
    will: [["It **will** rain tomorrow.", "Morgen **wird** es regnen."], ["I **want** an ice cream.", "Ich **will** ein Eis."], ["I**'ll** call you later.", "Ich **rufe** dich später **an**."], ["I **won't** tell anyone.", "Ich **werde** es niemandem sagen."]],
    comparison: [["Tom is **taller than** Ben.", "Tom ist **größer als** Ben."], ["Maths is **more difficult than** art.", "Mathe ist **schwieriger als** Kunst."], ["This is **the best** day ever!", "Das ist **der beste** Tag überhaupt!"], ["My bike is **as fast as** yours.", "Mein Fahrrad ist **so schnell wie** deins."]],
    adverbsmanner: [["She is **quiet**.", "Sie ist **leise**."], ["She speaks **quietly**.", "Sie spricht **leise**."], ["He plays **well**.", "Er spielt **gut**."], ["Please walk **slowly**.", "Bitte geh **langsam**."]],
    if12: [["If it **rains**, I **will stay** at home.", "Wenn es **regnet**, **bleibe** ich zu Hause."], ["If you **hurry**, you **will catch** the bus.", "Wenn du dich **beeilst**, **erwischst** du den Bus."], ["If I **were** rich, I **would buy** an island.", "Wenn ich reich **wäre**, **würde** ich eine Insel **kaufen**."], ["If I **were** you, I **would call** her.", "An deiner Stelle **würde** ich sie **anrufen**."]],
    if3: [["If I **had learned**, I **would have passed**.", "Wenn ich gelernt **hätte**, **hätte** ich bestanden."], ["If we **had left** earlier, we **would have caught** the train.", "Wenn wir früher losgefahren **wären**, **hätten** wir den Zug erwischt."], ["If you **had asked** me, I **would have helped** you.", "Wenn du mich gefragt **hättest**, **hätte** ich dir geholfen."], ["If it **hadn't rained**, we **would have gone** to the beach.", "Wenn es nicht geregnet **hätte**, **wären** wir an den Strand gegangen."]]
  };
  window.GRAMMAR.Englisch.topics.forEach(t => { if (V[t.id]) { t.vgl = V[t.id]; t.vglEx = E[t.id] || []; } if (AUS[t.id]) t.aus = AUS[t.id]; });
})();
