import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { StartAdventureRequest, AdventureRow } from "@/lib/game/types";

// ── Scenario hooks: 5+ unique opening scenarios per world ────────────────────
// One is picked at random each new adventure to ensure fresh stories + NPCs
const SCENARIO_HOOKS: Record<string, string[]> = {
  xian_xia: [
    "宗門大考日，你以廢靈根資質意外通過內門考核，讓眾多師兄弟嫉妒難平。入門師兄【趙雲峰】當場立下賭約，要讓你三個月內滾出宗門。",
    "山崩事故中你墜入一處古代禁地，發現殘破石碑和一具抱劍白骨——白骨身旁還有一本無名秘籍，墨跡猶新。守禁地的器靈【無名】突然開口，聲音出奇地像個孩子。",
    "你是宗門最底層的雜役弟子。某夜不小心聽見長老密議：三月後，有一方勢力將滅宗——密議中提到了你的名字，理由不明。",
    "荒野中你撿到一枚刻有奇紋的靈器，戴上後無法取下。三日之內，七個不同門派的追殺令同時貼上了你的通緝畫像。同行的江湖散修【柳千尋】說她知道原因，但要你先救她一命。",
    "宗門賜婚，對象是你的死對頭【沈無痕】。成婚前夕，你在洞房的地板下挖出一封信，信上說婚事是個局——而局的目標不是你，是你的父母。",
  ],
  campus: [
    "轉學第一天，座位被安排在全校最神秘的問題學生【顧辭】旁邊。他從不和任何人說話，卻在課本扉頁留了一行字給你：「離這裡遠一點，否則你會後悔。」",
    "你意外發現班上成績第一、形象完美的學生代表【林晴】在廁所偷哭。她的秘密比你想像的還要沉——而她已經發現你知道了。",
    "校慶文化祭前，你收到一封匿名情書，信末寫著一個時間和地點。那個地點是已經廢棄三年、傳說鬧鬼的音樂教室。",
    "你被迫接任學生會副會長，前任在交接時悄悄塞給你一個隨身碟，說：「學校有個秘密，三十年了，沒人敢說出來。」第二天他就轉學了。",
    "畢業旅行最後一夜，全班困在山區暴雨中，手機通訊中斷。旅館服務生【阿澤】說有個規矩：天黑後不能照鏡子。你問為什麼，他看了你一眼，沒有回答。",
  ],
  apocalypse: [
    "末日第七天，你在超市廢墟中醒來，記憶空白。身旁只有一罐罐頭和一個陌生人【馮燁】——他說他救了你，但不說為什麼。",
    "你是地下避難所唯一的守衛。某夜，帶傷的陌生女人【季安】拍門求救。廣播規定嚴禁放陌生人進入，但她知道你的全名，以及你死去家人的名字。",
    "避難所城牆出現裂縫，但方向不對——裂縫是從內側往外打的。你是新上任的安全官，負責查出幕後黑手，而第一個嫌疑人竟然是你最信任的人。",
    "神秘廣播播出了一組座標，聲稱那裡有疫苗。三個倖存者小隊搶著出發——你被迫和其中一隊臨時合作，隊長【陸凜】對你有說不清的敵意。",
    "你的倖存者隊伍接納了一個從廢城走出的女孩【小寒】，她七歲，記憶力驚人，卻從來不睡覺。第三天夜裡，你看見她站在帳篷外，盯著黑暗，嘴裡在說話——回應她的，不是人聲。",
  ],
  adult: [
    "失業的第一個夜晚，你在陌生酒吧喝悶酒。鄰座的人轉過臉——是【江以晴】，你以為這輩子都不會再見面的那個人。她沒有逃走，反而先開口問你還好嗎。",
    "出差最後一夜，飯店超訂，前台說只剩一間房，要和另一位客人【沈臨】共用。他比你更不情願，但他趕末班機走不了，你也是。",
    "相親局上，你認出了對方——是前任最好的朋友【許非】。他顯然也認出了你。主持人問你們認不認識，你們同時說「不認識」。",
    "深夜，手機響，陌生號碼。對方說他欠你一個解釋，說的事情是五年前你放棄的那份工作機會——而打電話來的人是那家公司的現任CEO，說公司快要倒閉了。",
    "新鄰居搬入的第一天，直接敲你的門借鹽，然後順手坐進你的沙發，說她的搬家公司還沒來，問能不能在你家等。她叫【宋曉】，笑起來讓人沒辦法說不。",
  ],
  wuxia: [
    "你在江湖上名聲狼藉、四處躲債。一個蒙面女子送來拜帖，說她能幫你洗清七年前的滅門冤案——代價是替她做一件「小事」，但那件事要你去殺人。",
    "押鏢夜行，貨物是一個上了三道鎖的木箱，委託人說不能問裡面是什麼。攔路的是你的師兄【裴長空】，他說那個箱子不能送到目的地，否則死的人會很多。",
    "荒廟裡你揀到一本殘缺刀譜，習練三日後，感覺有人在窗外盯著你。第七日，內力大增，但鏡中倒影的動作——比你慢了半拍。",
    "武林大會前夕，掌門師父在密室暴斃，你是最後進入密室的人，也是唯一的目擊者。調查的人是你，嫌疑人也是你。",
    "你失手殺了黑道【血煞堂】堂主的獨子——但那是誤傷，對方先動的手。逃亡路上遇到一個形容落拓的老乞丐【獨眼陳】，他說他能救你，但要你先相信他一件事：那個「獨子」根本沒死。",
  ],
  western_fantasy: [
    "冒險者公會佈告欄上貼著一張懸賞令，你的臉被畫在上面，罪名是你根本不記得犯過的事。懸賞人署名【銀鐮公會】，酬勞是五千金幣——你自己。",
    "廢墟深處你找到一本會說話的魔法書，它聲稱自己是已死巫師的靈魂。它說你身上有一個詛咒，而詛咒的源頭就在你出生的那個村子——一個三年前從地圖上消失的村子。",
    "護送任務，對象是一名看起來普通的精靈女孩【伊拉】。穿過禁林時，她告訴你她其實是通緝犯，護送費用是真的，但目的地不是。",
    "龍蛋孵化了。幼龍把你認作了母親。現在整個騎士團、龍族議會、還有一個你不認識的神秘組織都在找你——理由各自不同，但都很緊迫。",
    "深夜，一個詛咒降臨在你身上：黎明前若找不到一個「願意與你共度危難之人」，你將化為石像。城裡的所有人你都認識，問題是——你不確定有誰真的願意。",
  ],
  cyberpunk: [
    "你的義眼手術後開始回放陌生的記憶：一個已死之人的最後七十二小時。那個人的名字你沒聽過，但記憶裡的地址——就是你現在所在的街區。",
    "黑市接了一個任務：刪除某個客戶的三段記憶，報酬豐厚。委託人是一個不該出現在底層的企業高管【柯銳】。刪除到第二段記憶時，你發現裡面有你自己的臉。",
    "夜市攤位後方，有人兜售一顆「共感晶片」，據說能讓你連進任何人的意識。你買下它，第一次啟動時進入的意識屬於你的上司——她正在和人討論怎麼處理掉你。",
    "成功入侵某企業數據庫的瞬間，你看到了一份「待清除名單」，你的名字在第三位。你有七十二小時，清除名單的執行人叫【鐵幕】，昨天他加了你的通訊頻道。",
    "義體改造手術後你醒來，記憶少了整整三天。監控記錄顯示那三天你正常上班、正常生活，但你的助理【妮可】說：那三天的你，眼睛沒有笑過一次。",
  ],
  horror: [
    "你租了一間租金低得離譜的公寓，房東老人說只有一條規矩：43號房的門，任何情況都不能開。你搬進來的第一夜，43號房傳來了敲門聲——從裡面。",
    "失蹤同學【林默】失蹤前一天發給你一段無聲影片。影片裡是他的房間，安靜，燈亮著。你第七次回放的時候，終於發現床底下有什麼東西在看著鏡頭。",
    "清理外婆的遺物時，你在牆縫裡找到一本日記，記到了昨天，字跡是你的。你沒有寫過那些東西，但你記得那些事——它們都是你從未對任何人說過的秘密。",
    "深山露營第二夜，帳篷外有人在喊你的名字，聲音是你死去三年的朋友【陳然】。你沒有回應。第三次呼喚時，聲音移到了帳篷內側。",
    "和朋友玩了一個古老占卜遊戲，問了七個問題，七個回答全部應驗。第八個問題是你無意間說出口的：「那我什麼時候死？」答案已經顯現在紙上，你還沒有看。",
  ],
  palace_intrigue: [
    "入宮第三天，你親眼看見貴妃娘娘的心腹太監【竇喜】在禦花園毒殺了一名宮女——宮女倒下前抓住你的袖子，把一塊玉牌塞進你手裡。",
    "皇帝賜婚，對象是威名赫赫的攝政王【蕭燁】。宮裡人人都知道他前三任配偶全部死得離奇。成婚前夜，一封匿名信滑進你的房間：「他知道你的秘密，和你成婚是為了讓你閉嘴。」",
    "你截獲了一份密摺，內容涉及刺殺皇帝的計畫，主謀的印章屬於你的恩人——當年救你入宮的老尚書。你只有今晚決定：交出去，還是燒掉。",
    "宮中連環中毒案，四名妃嬪先後暈倒，御醫束手無策。皇帝召你徹查，限三日破案，否則滿門株連。線索指向的第一個人，是皇帝最寵愛的皇子。",
    "你冒充身份混入後宮，扮演的是一個因病亡故的側妃。但入宮第二日，真正的側妃出現了——她沒有死，而且認出了你。她說她願意合作，因為她們有共同的敵人。",
  ],
  wasteland: [
    "廢土第三天，車子在一座空城正中熄火。城裡的廣播只重複一句話：「今晚留在室內，不要開燈，不要出聲。」廣播員的聲音你認識——那是你死去兩年的同伴【老梁】。",
    "輻射地帶邊緣，一個獨自行走的孩子【小魚】攔住你，說在找她爸爸。她說的名字你沒聽過。你查了一下殘存的記錄，那個名字屬於一個三年前在這片地帶失蹤的拾荒者。",
    "你用三十斤廢鐵換到一張手繪地圖，上面標著一處「淨水源頭」。出發半天後，你在後視鏡裡第一次發現有人在跟蹤——一輛車，沒有車牌，車頂架著武器。",
    "廢土最大勢力「鐵幕軍閥」的頭目【鄭鐵】突然宣佈你是他指定的繼承人，向全荒野廣播。你從來沒見過他，也完全不明白他的動機——但現在所有渴望那個位子的人，都把槍口對向了你。",
    "遺蹟深處，你發現了一臺仍在運作的終端機，連著一個沉睡了二十年的AI【伊甸】。它說它知道末日是怎麼開始的，以及怎麼讓它結束——但需要你的幫助才能完成最後一步。",
  ],
  taiwanese_folk: [
    "宮廟緊急傳召，說萬華某條老街連續三夜有人昏倒，醒來後眼神空洞、說著不像人說的話。廟公【阿義伯】要你去查——他說那股煞氣的味道不像普通冤魂，比較像是某個被封印的東西剛剛鬆動了。",
    "你跑外送，客戶地址是信義區一棟廢棄大樓，收件人姓名你查了才知道——是三年前在那棟樓跳下去的人。包裹是什麼你不知道，但門縫透出的金紙灰味告訴你，有人一直沒停過在那裡燒東西。",
    "師父失聯整整七天，廟裡的神像開始哭血，五營旗無風自動，焦黑的邊緣像是從裡面燒出來的。同門師兄【阿廷】說不能等了，但他同時說你要先弄清楚一件事：師父失蹤前，最後見的人是你。",
    "一個女孩子站在廟口，從昨晚等到天亮。她說她爸爸被什麼東西跟上了——不是鬼，是外道。她怎麼知道的？因為她爸爸的影子，現在走在他的前面。",
    "西門町夜市出現連環昏迷案，現場有踏罡步斗的腳印，符灰的分布方式是你認識的某一套陣法。不是外人的手法，是同門的——但名冊上那個人，前年就已經入塔了。",
  ],
  custom: [
    "一個陌生人在你毫無防備的時候，把一個改變一切的東西塞進你手裡，然後在人群中消失，留下一句話：「現在你是唯一知道這件事的人了。」",
    "你在整理舊物時，發現了一封寫著你名字但從未開啟的信，郵戳顯示寄出時間是你出生之前。",
    "一個深夜的決定，讓你踏進了一扇原本不應該存在的門，門的另一側，一切都和你記憶中的不一樣。",
    "有人告訴你：你以為最了解的那個人，其實一直在隱瞞你一件事，而那件事正在改變你的命運走向。",
    "任務本來是例行公事，但抵達目的地後，你意識到有人精心安排了你出現在這裡，而你不知道對方想要什麼。",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  // World types supported natively by the DB enum
  const DB_WORLD_TYPES = new Set(["xian_xia", "campus", "apocalypse", "adult", "custom"]);

  try {
    const body: StartAdventureRequest = await req.json();
    const { playerName, worldType, characterBio, writingStyle, gender, inheritLegacyId, traits } = body;
    const db = getSupabaseAdmin();
    // Map new world types to "custom" for DB compatibility; store real flavor in world_attributes
    const dbWorldType = DB_WORLD_TYPES.has(worldType) ? worldType : "custom";

    if (!playerName?.trim()) {
      return NextResponse.json({ error: "請填入角色名稱" }, { status: 400 });
    }

    let playerId: string;
    const { data: existing } = await db
      .from("players").select("id").eq("username", playerName.trim()).single();

    if (existing) {
      playerId = existing.id;
    } else {
      const { data: newPlayer, error } = await db
        .from("players").insert({ username: playerName.trim() }).select("id").single();
      if (error || !newPlayer)
        return NextResponse.json({ error: `建立玩家失敗: ${error?.message}` }, { status: 500 });
      playerId = newPlayer.id;
    }

    let legacyModifiers: Record<string, unknown> = {};
    let generation = 1;

    if (inheritLegacyId) {
      const { data: legacy } = await db
        .from("legacy_pool").select("*")
        .eq("id", inheritLegacyId).eq("player_id", playerId).single();
      if (legacy) {
        generation = legacy.generation + 1;
        const skillBonus: Record<string, number> = {};
        for (const s of (legacy.inherited_skills ?? []))
          skillBonus[s.skill] = Math.round(s.level * (s.decay ?? 0.8));
        legacyModifiers = { affection_bonus: legacy.affection_modifiers ?? {}, skill_bonus: skillBonus };
      }
    }

    // Pick a random opening scenario for this world — stored so prompt.ts can use it
    const worldFlavor = worldType !== dbWorldType ? worldType : worldType;
    const hookPool = SCENARIO_HOOKS[worldFlavor] ?? SCENARIO_HOOKS.custom;
    const scenarioHook = pickRandom(hookPool);

    const worldAttributes: Record<string, unknown> = {
      ...(worldType !== dbWorldType ? { world_flavor: worldType } : {}),
      ...(characterBio ? { character_bio: characterBio } : {}),
      ...(writingStyle ? { writing_style: writingStyle } : {}),
      ...(gender ? { gender } : {}),
      scenario_hook: scenarioHook,
      ...(traits && traits.length > 0 ? { traits } : {}),
    };

    const { data: adventure, error } = await db
      .from("adventures")
      .insert({ player_id: playerId, world_type: dbWorldType, generation, legacy_modifiers: legacyModifiers, world_attributes: worldAttributes })
      .select("*").single();

    if (error || !adventure)
      return NextResponse.json({ error: `建立冒險失敗: ${error?.message}` }, { status: 500 });

    return NextResponse.json(adventure as AdventureRow, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/game/start]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
