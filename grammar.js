// Grammatik-Themen nach dem Bildungsplan Baden-Württemberg (Gymnasium, G9, Fassung V3.0 vom 23. März 2026).
// Der Bildungsplan nennt nur Doppelklassen (5/6, 7/8 …). Die Aufteilung auf Klasse 5 und 6 ist ein Vorschlag
// nach der Reihenfolge üblicher Schulbücher und lässt sich hier pro Thema über "band" ändern.
//
// Aufbau eines Themas:
//   id, band (Schlüssel aus bands), t (Titel wie im Bildungsplan), de (deutscher Untertitel),
//   rez: true = im Bildungsplan nur rezeptiv (erkennen statt selbst bilden),
//   g8: true = steht nur im Bildungsplan G8 (V2, gilt noch für die älteren Jahrgänge),
//   explain: Absätze der Erklärung (**fett** wird markiert), ex: Beispiele [Fremdsprache, Deutsch],
//   tasks: Aufgaben
//     ["gap", "Satz mit ___ (Hinweis)", "Lösung|andere Lösung", "Erklärung bei Fehlern"]
//     ["pick", "Satz mit ___", ["richtig", "falsch", "falsch"], "Erklärung bei Fehlern"]
//     ["order", "Richtig geordneter Satz.", "Erklärung bei Fehlern"]
// Themen ohne explain stehen in der Übersicht als "kommt noch".
window.GRAMMAR = {
  Englisch: {
    source: "Bildungsplan BW, Gymnasium (G9), Englisch als erste Fremdsprache, V3.0 (2026)",
    bands: [
      { id: "5", label: "Klasse 5", note: "Bildungsplan Klassen 5/6, Aufteilung auf Klasse 5 und 6 ist ein Vorschlag" },
      { id: "6", label: "Klasse 6", note: "Bildungsplan Klassen 5/6, Aufteilung auf Klasse 5 und 6 ist ein Vorschlag" },
      { id: "7/8", label: "Klassen 7/8" },
      { id: "9/10", label: "Klassen 9/10" },
      { id: "11", label: "Klasse 11" },
      { id: "12/13", label: "Klassen 12/13" }
    ],
    topics: [
      // ---------- Klasse 5 ----------
      { id: "plural", band: "5", t: "Singular and plural of nouns", de: "Einzahl und Mehrzahl",
        explain: [
          "Meist hängst du einfach **-s** an: book → book**s**, cat → cat**s**.",
          "Nach s, sh, ch und x kommt **-es**: bus → bus**es**, box → box**es**, watch → watch**es**.",
          "Steht vor dem y ein Konsonant, wird daraus **-ies**: baby → bab**ies**. Aber: boy → boy**s**, weil vor dem y ein Vokal steht.",
          "Einige Wörter sind unregelmäßig und du lernst sie auswendig: man → **men**, woman → **women**, child → **children**, foot → **feet**, tooth → **teeth**, mouse → **mice**, person → **people**."
        ],
        ex: [["two **books**", "zwei Bücher"], ["three **boxes**", "drei Schachteln"], ["many **children**", "viele Kinder"]],
        tasks: [
          ["gap", "one cat, two ___ (cat)", "cats"],
          ["gap", "one bus, three ___ (bus)", "buses", "Nach s kommt -es."],
          ["gap", "one baby, two ___ (baby)", "babies", "Konsonant + y wird zu -ies."],
          ["gap", "one boy, two ___ (boy)", "boys", "Vor dem y steht ein Vokal (o), also nur -s."],
          ["gap", "one child, five ___ (child)", "children", "child ist unregelmäßig: children."],
          ["gap", "one box, four ___ (box)", "boxes", "Nach x kommt -es."],
          ["pick", "There are two ___ at the door.", ["women", "womans", "womens"], "woman → women ist unregelmäßig."],
          ["pick", "My ___ hurt after the long walk.", ["feet", "foots", "feets"], "foot → feet ist unregelmäßig."]
        ] },
      { id: "articles", band: "5", t: "Definite and indefinite article", de: "a, an und the",
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
          ["pick", "My mum is ___ doctor.", ["a", "the", "–"], "Bei Berufen steht im Englischen a oder an."],
          ["pick", "Can you open ___ window, please? It's hot in here.", ["the", "a", "an"], "Es ist klar, welches Fenster gemeint ist."],
          ["pick", "I've got ___ idea!", ["an", "a"], "idea fängt mit einem Vokal-Laut an."],
          ["pick", "There's ___ elephant in the zoo.", ["an", "a"], "elephant fängt mit einem Vokal-Laut an."]
        ] },
      { id: "simplepresent", band: "5", t: "Simple present", de: "Gewohnheiten und Tatsachen",
        explain: [
          "Das simple present benutzt du für Gewohnheiten, Regeln und Dinge, die immer so sind. Signalwörter: always, usually, often, sometimes, never, every day.",
          "Bei **he, she, it** hängst du ein **-s** an: I play → she play**s**. Merksatz: „He, she, it – das s muss mit!“",
          "Nach s, sh, ch, x und o kommt **-es**: watch → watch**es**, go → go**es**. Konsonant + y wird zu **-ies**: fly → fl**ies**.",
          "Unregelmäßig: have → **has**, be → **is**."
        ],
        ex: [["I **play** football every Friday.", "Ich spiele jeden Freitag Fußball."], ["My sister **watches** TV after school.", "Meine Schwester sieht nach der Schule fern."], ["Tom **has** a dog.", "Tom hat einen Hund."]],
        tasks: [
          ["gap", "She ___ to school by bus. (go)", "goes", "she → -s, und nach o kommt -es."],
          ["gap", "My dad ___ the dishes every evening. (wash)", "washes", "Nach sh kommt -es."],
          ["gap", "We ___ English on Mondays. (have)", "have", "Bei we bleibt das Verb ohne -s."],
          ["gap", "Emma ___ a cat. (have)", "has", "Emma = she, und have wird zu has."],
          ["gap", "The baby ___ a lot. (cry)", "cries", "Konsonant + y wird zu -ies."],
          ["pick", "Ben and Lisa ___ in Leeds.", ["live", "lives"], "Ben and Lisa = they, also ohne -s."],
          ["pick", "It ___ a lot in Wales.", ["rains", "rain"], "it → das s muss mit."],
          ["order", "She always reads in bed.", "always steht vor dem Verb."]
        ] },
      { id: "questions", band: "5", t: "Questions", de: "Fragen stellen",
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
          ["gap", "Where ___ you live?", "do", "Bei you nimmst du do."],
          ["gap", "What time ___ the film start?", "does", "the film = it, also does."],
          ["pick", "Does he ___ chips?", ["like", "likes"], "Nach does steht das Verb ohne -s."],
          ["pick", "___ is your birthday? – In May.", ["When", "Who", "Where"], "Die Antwort ist eine Zeit, also when."],
          ["order", "Where does your aunt live?", "Fragewort, dann does, dann Person, dann Verb."]
        ] },
      { id: "shortanswers", band: "5", t: "Short answers", de: "Kurzantworten",
        explain: [
          "Auf Ja/Nein-Fragen antwortest du im Englischen nicht nur mit Yes oder No. Du nimmst das **Hilfsverb aus der Frage** wieder auf.",
          "**Do** you like cats? – Yes, I **do**. / No, I **don't**.",
          "**Is** she nice? – Yes, she **is**. / No, she **isn't**.",
          "Bei Yes gibt es keine Kurzform: Yes, I **am**. (nicht: Yes, I'm.)"
        ],
        ex: [["Can you swim? – Yes, I **can**.", "Kannst du schwimmen? – Ja."], ["Does Tom like pizza? – No, he **doesn't**.", "Mag Tom Pizza? – Nein."]],
        tasks: [
          ["gap", "Do you like cats? – Yes, I ___.", "do"],
          ["gap", "Does Tom play football? – No, he ___.", "doesn't|does not", "In der Frage steht does, also doesn't."],
          ["pick", "Are you tired? – Yes, I ___.", ["am", "are", "do"], "Zu you passt in der Antwort I am."],
          ["pick", "Is it raining? – No, it ___.", ["isn't", "doesn't", "aren't"], "In der Frage steht is, also isn't."],
          ["gap", "Can your sister swim? – Yes, she ___.", "can"],
          ["pick", "Are your parents at home? – No, they ___.", ["aren't", "don't", "isn't"], "Zu they passt are, also aren't."],
          ["pick", "Have you got a pet? – Yes, I ___.", ["have", "got", "do"], "Have you got … ? – Yes, I have."],
          ["gap", "Does your dog bark a lot? – Yes, it ___.", "does"]
        ] },
      { id: "negations", band: "5", t: "Negations", de: "Verneinung",
        explain: [
          "Im simple present verneinst du mit **don't** (do not) oder **doesn't** (does not) und dem Verb ohne -s: I **don't like** fish. She **doesn't like** fish.",
          "Mit am, is, are hängst du **not** an: I'm **not**, he **isn't**, they **aren't**.",
          "Mit can wird es **can't**: My dog **can't** swim."
        ],
        ex: [["I **don't** like spiders.", "Ich mag keine Spinnen."], ["Max **doesn't** eat meat.", "Max isst kein Fleisch."], ["We **aren't** at home.", "Wir sind nicht zu Hause."]],
        tasks: [
          ["gap", "I ___ like spiders. (nicht)", "don't|do not"],
          ["gap", "Max ___ like spiders. (nicht)", "doesn't|does not", "Max = he, also doesn't."],
          ["pick", "She doesn't ___ milk.", ["drink", "drinks"], "Nach doesn't steht das Verb ohne -s."],
          ["pick", "We ___ at home today.", ["aren't", "don't", "isn't"], "Mit be: we are → we aren't."],
          ["pick", "My dog ___ swim.", ["can't", "doesn't can", "don't"], "can wird zu can't, ohne do."],
          ["gap", "It ___ cold today. (nicht sein)", "isn't|is not"],
          ["order", "My brother doesn't eat meat."],
          ["pick", "They ___ live in London.", ["don't", "doesn't", "aren't"], "Bei they nimmst du don't."]
        ] },
      { id: "commands", band: "5", t: "Commands and requests", de: "Aufforderungen und Bitten",
        explain: [
          "Eine Aufforderung beginnt mit dem **Verb in der Grundform**, ohne you: **Open** your books! **Listen**!",
          "Verneint sagst du **Don't**: **Don't** run! **Don't** be late!",
          "Mit **please** wird es eine höfliche Bitte: **Please** sit down. / Sit down, **please**.",
          "Einen Vorschlag machst du mit **Let's**: **Let's** go to the park!"
        ],
        ex: [["**Close** the door, please.", "Mach bitte die Tür zu."], ["**Don't** touch that!", "Fass das nicht an!"], ["**Let's** play a game!", "Lass uns ein Spiel spielen!"]],
        tasks: [
          ["pick", "___ the window, please.", ["Open", "Opens", "You open"], "Aufforderungen beginnen mit der Grundform."],
          ["pick", "___ talk in the library!", ["Don't", "Not", "No"], "Verneint: Don't + Verb."],
          ["gap", "___ late! (nicht + sein)", "Don't be|Do not be"],
          ["order", "Please close the door."],
          ["pick", "___ play a game!", ["Let's", "Lets us", "Let"], "Vorschläge mit Let's."],
          ["gap", "___ quiet, please! (sein)", "Be", "Grundform von sein: be."],
          ["order", "Don't touch the cake."],
          ["pick", "Sit down, ___.", ["please", "thanks", "sorry"], "Bitten mit please."]
        ] },
      { id: "wordorder", band: "5", t: "Word order (SPO)", de: "Satzstellung",
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
      { id: "genitive", band: "5", t: "Genitive", de: "Wem gehört was?",
        explain: [
          "Wem etwas gehört, zeigst du mit **'s**: Tom**'s** bike = das Fahrrad von Tom.",
          "Endet die Mehrzahl auf -s, hängst du nur den Apostroph an: my parent**s'** car = das Auto meiner Eltern.",
          "Bei unregelmäßiger Mehrzahl ohne -s nimmst du wieder **'s**: the children**'s** room.",
          "Bei Dingen nimmst du meist **of**: the end **of** the film."
        ],
        ex: [["This is **Emma's** pen.", "Das ist Emmas Stift."], ["My **grandparents'** house is big.", "Das Haus meiner Großeltern ist groß."], ["the end **of** the story", "das Ende der Geschichte"]],
        tasks: [
          ["gap", "This is the bike of Tom. → This is ___ bike.", "Tom's"],
          ["gap", "the dog of my sister → my ___ dog", "sister's"],
          ["pick", "the car of my parents → my ___ car", ["parents'", "parent's", "parents's"], "Mehrzahl auf -s: nur Apostroph."],
          ["pick", "the room of the children → the ___ room", ["children's", "childrens'", "childrens"], "children hat kein -s, also 's."],
          ["gap", "the house of Mr Smith → ___ house", "Mr Smith's"],
          ["pick", "the end ___ the story", ["of", "'s", "from"], "Bei Dingen meist of."],
          ["pick", "Is this ___ pen?", ["Emma's", "Emmas", "Emma"], "Besitz: Emma's."],
          ["pick", "That's my ___ room. (Ich habe zwei Brüder.)", ["brothers'", "brother's", "brothers's"], "Zwei Brüder: Mehrzahl auf -s, nur Apostroph."]
        ] },
      { id: "adverbsfreq", band: "5", t: "Adverbs of place, time and frequency", de: "Wo, wann, wie oft",
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
          ["gap", "I ___ eat fish. I hate it! (nie)", "never"],
          ["pick", "They play football ___.", ["there every day", "every day there"], "Ort vor Zeit."],
          ["order", "He is usually at home."]
        ] },
      { id: "presentprog", band: "5", t: "Present progressive", de: "Was gerade passiert",
        explain: [
          "Mit dem present progressive sagst du, was **gerade jetzt** passiert. Signalwörter: now, right now, at the moment, Look!, Listen!",
          "Form: **am/is/are + Verb mit -ing**: I **am reading**. She **is playing**. They **are running**.",
          "Schreibung: Ein stummes e fällt weg: make → mak**ing**. Nach kurzem Vokal wird der Konsonant verdoppelt: swim → swi**mm**ing, run → ru**nn**ing.",
          "Unterschied: simple present = immer oder oft, present progressive = jetzt gerade."
        ],
        ex: [["Look! It **is snowing**.", "Schau! Es schneit."], ["I **am doing** my homework at the moment.", "Ich mache gerade meine Hausaufgaben."]],
        tasks: [
          ["gap", "Look! The dog ___ in the garden. (dig)", "is digging|'s digging", "is + dig + g + ing."],
          ["gap", "I ___ a book at the moment. (read)", "am reading|'m reading"],
          ["gap", "Listen! They ___ a song. (sing)", "are singing|'re singing"],
          ["gap", "We ___ in the lake right now. (swim)", "are swimming|'re swimming", "swim → swimming mit Doppel-m."],
          ["pick", "Be quiet! The baby ___.", ["is sleeping", "sleeps"], "Es passiert gerade jetzt."],
          ["pick", "My dad ___ to work every day.", ["goes", "is going"], "every day = Gewohnheit, also simple present."],
          ["gap", "What ___ you doing?", "are"],
          ["pick", "Mum ___ dinner right now.", ["is making", "is makeing", "makes"], "make → making, das e fällt weg."]
        ] },
      { id: "someany", band: "5", t: "some/any", de: "etwas, einige, keine",
        explain: [
          "**some** steht meist in **bejahten** Sätzen: I've got **some** apples.",
          "**any** steht in **Fragen** und **verneinten** Sätzen: Have you got **any** apples? I haven't got **any** apples.",
          "Bei Angeboten und Bitten nimmst du **some**, auch in Fragen: Would you like **some** tea? Can I have **some** water?",
          "Genauso: something/anything, somebody/anybody."
        ],
        ex: [["There are **some** cookies.", "Da sind ein paar Kekse."], ["Is there **any** milk?", "Gibt es Milch?"], ["Would you like **some** juice?", "Möchtest du etwas Saft?"]],
        tasks: [
          ["pick", "There are ___ cookies on the table.", ["some", "any"], "Bejahter Satz: some."],
          ["pick", "Is there ___ milk in the fridge?", ["any", "some"], "Frage: any."],
          ["pick", "I haven't got ___ money.", ["any", "some"], "Verneinter Satz: any."],
          ["pick", "Would you like ___ juice?", ["some", "any"], "Angebot: some, auch in der Frage."],
          ["pick", "We need ___ eggs for the cake.", ["some", "any"]],
          ["pick", "Have you got ___ brothers or sisters?", ["any", "some"]],
          ["pick", "There isn't ___ bread left.", ["any", "some"]],
          ["pick", "Can I have ___ water, please?", ["some", "any"], "Bitte: some, auch in der Frage."]
        ] },
      { id: "simplepast", band: "5", t: "Simple past", de: "Was früher passiert ist",
        explain: [
          "Mit dem simple past erzählst du, was in der Vergangenheit passiert und abgeschlossen ist. Signalwörter: yesterday, last week, two days ago, in 2020.",
          "Regelmäßige Verben bekommen **-ed**: play → play**ed**, live → live**d**, stop → sto**pped**, cry → cr**ied**.",
          "Unregelmäßige Verben lernst du auswendig: go → **went**, see → **saw**, have → **had**, be → **was/were**.",
          "Fragen und Verneinung bildest du mit **did** und der Grundform: **Did** you **see** it? I **didn't see** it."
        ],
        ex: [["Yesterday we **played** football.", "Gestern haben wir Fußball gespielt."], ["Last summer I **went** to Spain.", "Letzten Sommer bin ich nach Spanien gefahren."], ["**Did** you **like** the film?", "Hat dir der Film gefallen?"]],
        tasks: [
          ["gap", "Yesterday we ___ football. (play)", "played"],
          ["gap", "Last summer I ___ to Spain. (go)", "went", "go ist unregelmäßig: went."],
          ["gap", "She ___ a fox in the park. (see)", "saw", "see ist unregelmäßig: saw."],
          ["gap", "The baby ___ all night. (cry)", "cried", "Konsonant + y wird zu -ied."],
          ["pick", "I ___ tired yesterday.", ["was", "were", "am"], "I → was."],
          ["pick", "___ you watch the match last night?", ["Did", "Do", "Was"], "Frage in der Vergangenheit: did."],
          ["pick", "We didn't ___ the bus.", ["catch", "caught", "catched"], "Nach didn't steht die Grundform."],
          ["gap", "They ___ at home last weekend. (nicht sein)", "weren't|were not", "they → were, verneint weren't."]
        ] },
      // ---------- Klasse 6 ----------
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
          ["gap", "Can I have a ___ of cake? (Stück)", "piece"],
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
          ["gap", "How ___ is the T-shirt? – It's £10.", "much"]
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
          ["gap", "I ___ my homework. (finish)", "have finished|'ve finished"],
          ["gap", "She ___ this film three times. (see)", "has seen|'s seen", "see – saw – seen."],
          ["pick", "Have you ___ been to London?", ["ever", "yet"], "Schon einmal = ever."],
          ["gap", "We have just ___ lunch. (eat)", "eaten", "eat – ate – eaten."],
          ["pick", "Tom ___ lost his key.", ["has", "have"], "Tom = he, also has."],
          ["pick", "They have ___ to the beach.", ["gone", "went", "go"], "Nach have steht die 3. Form."],
          ["pick", "I have never ___ a horse.", ["ridden", "rode", "ride"], "ride – rode – ridden."],
          ["gap", "My parents ___ a new car. (buy)", "have bought|'ve bought", "buy – bought – bought."]
        ] },
      { id: "goingto", band: "6", t: "going to-future", de: "Pläne und Absichten",
        explain: [
          "Mit **going to** sprichst du über **Pläne**: I**'m going to** visit my aunt next week.",
          "Und über etwas, das man **schon kommen sieht**: Look at the clouds! It**'s going to** rain.",
          "Form: **am/is/are + going to + Grundform**."
        ],
        ex: [["I**'m going to** learn the guitar.", "Ich werde Gitarre lernen."], ["Watch out! You**'re going to** fall!", "Pass auf! Du fällst gleich!"]],
        tasks: [
          ["gap", "I ___ going to buy a new bike.", "am|'m"],
          ["gap", "My sister ___ going to learn Spanish.", "is|'s"],
          ["pick", "We are going to ___ a party.", ["have", "having", "has"], "Nach going to steht die Grundform."],
          ["gap", "Look at that boy! He ___ fall! (going to)", "is going to|'s going to"],
          ["pick", "___ you going to watch the match?", ["Are", "Do", "Will"], "Frage: Are you going to … ?"],
          ["order", "I am going to visit my grandma."],
          ["pick", "They ___ going to stay at home.", ["are", "is"]],
          ["gap", "What ___ you going to do this weekend?", "are"]
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
          ["gap", "I think it ___ snow tomorrow.", "will|'ll"],
          ["pick", "She will ___ you later.", ["call", "calls", "to call"], "Nach will steht die Grundform."],
          ["gap", "Don't worry, I ___ tell anyone. (nicht werden)", "won't|will not"],
          ["pick", "„Ich will ein Eis.“ heißt auf Englisch:", ["I want an ice cream.", "I will an ice cream."], "ich will = I want."],
          ["pick", "Maybe we ___ live on Mars one day.", ["will", "are"]],
          ["order", "I think you will like the film."],
          ["pick", "It's cold in here. – OK, I ___ close the window.", ["'ll", "am"], "Spontaner Entschluss: I'll."],
          ["gap", "___ you help me, please? (werden)", "Will"]
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
          ["gap", "An elephant is ___ than a dog. (big)", "bigger", "big → bigger mit Doppel-g."],
          ["gap", "This is the ___ day of my life! (happy)", "happiest", "y wird zu i: happiest."],
          ["gap", "Maths is ___ than art. (difficult)", "more difficult", "Lange Adjektive: more."],
          ["gap", "My cake is ___ than yours. (good)", "better", "good – better – best."],
          ["gap", "This is the ___ film I know. (bad)", "worst", "bad – worse – worst."],
          ["pick", "Lisa is taller ___ her mum.", ["than", "as", "then"], "als = than."],
          ["pick", "My bike is as fast ___ yours.", ["as", "than"], "as … as."],
          ["gap", "Mount Everest is the ___ mountain in the world. (high)", "highest"]
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
