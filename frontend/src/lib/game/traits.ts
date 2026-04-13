export type TraitRarity = "god" | "epic" | "rare" | "common";

export interface Trait {
  id: string;
  rarity: TraitRarity;
  names: Record<string, string>;
  effect: string;
}

export const RARITY_CONFIG: Record<TraitRarity, { label: string; color: string; bg: string; border: string }> = {
  god:    { label: "神級", color: "#ef4444", bg: "rgba(239,68,68,0.15)",    border: "rgba(239,68,68,0.6)" },
  epic:   { label: "史詩", color: "#a855f7", bg: "rgba(168,85,247,0.15)",   border: "rgba(168,85,247,0.6)" },
  rare:   { label: "優秀", color: "#3b82f6", bg: "rgba(59,130,246,0.15)",   border: "rgba(59,130,246,0.6)" },
  common: { label: "普通", color: "#9ca3af", bg: "rgba(156,163,175,0.08)",  border: "rgba(156,163,175,0.35)" },
};

export function getTraitName(trait: Trait, worldKey: string): string {
  return trait.names[worldKey] ?? trait.names.custom;
}

export function rollThreeTraits(): [Trait, Trait, Trait] {
  const copy = [...TRAIT_POOL].sort(() => Math.random() - 0.5);
  return [copy[0], copy[1], copy[2]];
}

export const TRAIT_POOL: Trait[] = [
  // ── 神級 (5) ──────────────────────────────────────────────────────────────
  {
    id: "chosen_one",
    rarity: "god",
    names: {
      xian_xia: "天選劍胎", wuxia: "武道天胎", campus: "時代寵兒",
      adult: "命運主角光環", cyberpunk: "神算進化核", apocalypse: "進化先驅體",
      western_fantasy: "神選勇者", horror: "命定倖存者",
      palace_intrigue: "天命貴人", wasteland: "廢土傳說王",
      taiwanese_folk: "天選乩身", custom: "天命之人",
    },
    effect: "絕境時有機率觸發意想不到的轉機。[氣運觸發]",
  },
  {
    id: "divine_talent",
    rarity: "god",
    names: {
      xian_xia: "先天靈根", wuxia: "先天武體", campus: "過目不忘天才",
      adult: "極致天生魅力", cyberpunk: "神經超頻進化", apocalypse: "A級進化基因",
      western_fantasy: "魔法親和體", horror: "第六感全覺醒",
      palace_intrigue: "天生帝王相", wasteland: "抗輻射變異基因",
      taiwanese_folk: "先天神契體質", custom: "先天異稟",
    },
    effect: "天生異稟，核心能力上限提升，成長速度遠超常人。",
  },
  {
    id: "companion_artifact",
    rarity: "god",
    names: {
      xian_xia: "伴生靈寶", wuxia: "命定神兵", campus: "神秘傳家之物",
      adult: "家族秘傳寶物", cyberpunk: "頂級定制義體", apocalypse: "末日傳說遺物",
      western_fantasy: "命運神器覺醒", horror: "古老守護符咒",
      palace_intrigue: "傳世鎮族之寶", wasteland: "廢土傳說裝備",
      taiwanese_folk: "神明親賜法器", custom: "靈器伴生",
    },
    effect: "攜帶一件與命運綁定的神器，危急時刻自動發揮奇效。",
  },
  {
    id: "past_life_memory",
    rarity: "god",
    names: {
      xian_xia: "前世仙人記憶", wuxia: "江湖傳承殘念", campus: "超凡學習直覺",
      adult: "商業天才本能", cyberpunk: "前世系統殘留程式", apocalypse: "末日預知夢境",
      western_fantasy: "古法師傳承碎片", horror: "詭異預知能力",
      palace_intrigue: "帝王謀略殘憶", wasteland: "廢土求生刻骨本能",
      taiwanese_folk: "神祖傳承記憶烙印", custom: "前世遺憶",
    },
    effect: "特定場景下前世記憶自動觸發，獲得關鍵情報或技能加持。",
  },
  {
    id: "fate_protection",
    rarity: "god",
    names: {
      xian_xia: "天道庇護", wuxia: "武道天意護體", campus: "天降奇緣光環",
      adult: "時代弄潮兒氣場", cyberpunk: "系統核心守護", apocalypse: "末世主角光環",
      western_fantasy: "命運女神眷顧", horror: "詛咒守護逆轉",
      palace_intrigue: "帝星護佑庇蔭", wasteland: "廢土傳說不死身",
      taiwanese_folk: "神明護持符令", custom: "命運庇護",
    },
    effect: "所有判定獲得隱性加成，世界本身站在你這邊。",
  },
  // ── 史詩 (8) ──────────────────────────────────────────────────────────────
  {
    id: "iron_will",
    rarity: "epic",
    names: {
      xian_xia: "不死道心", wuxia: "百折不撓俠骨", campus: "永不放棄的意志",
      adult: "鋼鐵神經抗壓", cyberpunk: "痛覺完全抑制", apocalypse: "末日求生鋼鐵意志",
      western_fantasy: "英雄不屈魂", horror: "恐懼完全免疫",
      palace_intrigue: "心如止水謀略", wasteland: "廢土硬漢不死心",
      taiwanese_folk: "五弊三缺不折意志", custom: "鐵血意志",
    },
    effect: "HP歸零前以1點保留，每局最多觸發一次。",
  },
  {
    id: "ultimate_charm",
    rarity: "epic",
    names: {
      xian_xia: "道韻天成氣質", wuxia: "俠義感召人心", campus: "萬人迷魅力光環",
      adult: "極致吸引力", cyberpunk: "人格植入魅力晶片", apocalypse: "末日領袖氣質",
      western_fantasy: "貴族天生風儀", horror: "詭異迷惑氣場",
      palace_intrigue: "傾國傾城容顏", wasteland: "廢土荒野傳奇",
      taiwanese_folk: "神格感召威儀", custom: "天賦魅力",
    },
    effect: "初次接觸的NPC好感度+15，魅力上限大幅提升。",
  },
  {
    id: "master_schemer",
    rarity: "epic",
    names: {
      xian_xia: "天機推算神算", wuxia: "算無遺策謀士", campus: "縱橫捭闔辯術",
      adult: "權謀高手", cyberpunk: "深度預測AI系統", apocalypse: "末日戰術天才",
      western_fantasy: "神秘命運占卜", horror: "詭計高手",
      palace_intrigue: "步步為營棋手", wasteland: "廢土謀略家",
      taiwanese_folk: "卜卦通神", custom: "算無遺策",
    },
    effect: "敵方行動前，系統自動給出一個提前警告提示。",
  },
  {
    id: "noble_bloodline",
    rarity: "epic",
    names: {
      xian_xia: "豪門弟子底蘊", wuxia: "世家武學傳承", campus: "豪門繼承人背景",
      adult: "富二代雄厚底氣", cyberpunk: "企業後台靠山", apocalypse: "末日囤積達人",
      western_fantasy: "貴族血脈傳承", horror: "神秘家族財富",
      palace_intrigue: "家族勢力背書", wasteland: "廢土資源囤積王",
      taiwanese_folk: "廟產繼承人", custom: "豐厚底蘊",
    },
    effect: "初始資源翻倍，特定付費選項對你免費。",
  },
  {
    id: "rapid_learner",
    rarity: "epic",
    names: {
      xian_xia: "一點即通頓悟", wuxia: "過目不忘武學", campus: "學霸快速吸收",
      adult: "快速掌握任何技能", cyberpunk: "神經加速學習晶片", apocalypse: "快速適應進化基因",
      western_fantasy: "魔法速成天賦", horror: "詭異知識自動吸收",
      palace_intrigue: "過目不忘宮廷學", wasteland: "廢土百科全書腦",
      taiwanese_folk: "法術速悟天賦", custom: "速悟天才",
    },
    effect: "每次學習/訓練場景，成長效果+50%。",
  },
  {
    id: "lucky_escape",
    rarity: "epic",
    names: {
      xian_xia: "吉人自有天相", wuxia: "命不該絕江湖緣", campus: "天降奇緣神助",
      adult: "奇妙巧合連連發", cyberpunk: "系統漏洞利用者", apocalypse: "奇蹟倖存率加持",
      western_fantasy: "幸運女神專寵", horror: "詭異力量守護",
      palace_intrigue: "逢凶化吉化解", wasteland: "廢土幸運傳說兒",
      taiwanese_folk: "神明特別庇佑", custom: "吉人天相",
    },
    effect: "每局有一次「奇蹟轉機」可在最危急時自動觸發。",
  },
  {
    id: "hidden_network",
    rarity: "epic",
    names: {
      xian_xia: "廣結善緣暗線", wuxia: "江湖廣布人脈網", campus: "校園風雲人物",
      adult: "業界人脈廣布", cyberpunk: "地下黑市網絡", apocalypse: "倖存者地下聯絡網",
      western_fantasy: "冒險者公會關係", horror: "神秘組織暗線",
      palace_intrigue: "八面玲瓏宮廷網", wasteland: "廢土情報暗線",
      taiwanese_folk: "宮廟系統人脈", custom: "暗線人脈",
    },
    effect: "初始隱藏盟友×1，危機時可觸發神秘援助出現。",
  },
  {
    id: "sealed_power",
    rarity: "epic",
    names: {
      xian_xia: "封印天魔之力", wuxia: "沉睡絕世武學", campus: "封印的隱藏才能",
      adult: "壓抑的第二人格", cyberpunk: "鎖定的頂級程式", apocalypse: "沉睡中的頂級異能",
      western_fantasy: "封印的遠古魔法", horror: "封印的詛咒反噬",
      palace_intrigue: "隱藏的真實身份", wasteland: "覺醒中的變異基因",
      taiwanese_folk: "未解封的神格層次", custom: "封印之力",
    },
    effect: "壓力值達80時，封印解除，獲得一次超規格行動機會。",
  },
  // ── 優秀 (10) ────────────────────────────────────────────────────────────
  {
    id: "eagle_eye",
    rarity: "rare",
    names: {
      xian_xia: "神識外放洞察", wuxia: "耳聽八方目觀六路", campus: "敏銳觀察力",
      adult: "精準人心判斷力", cyberpunk: "熱感應義眼升級", apocalypse: "變異超感知能力",
      western_fantasy: "夜視偵察術", horror: "靈異感知開啟",
      palace_intrigue: "耳目靈通情報", wasteland: "輻射感應第六感",
      taiwanese_folk: "陰陽眼天生", custom: "洞察入微",
    },
    effect: "隱藏線索和危險的提示出現率+30%。",
  },
  {
    id: "fast_heal",
    rarity: "rare",
    names: {
      xian_xia: "靈力自動療愈", wuxia: "內功運氣療傷", campus: "超強體質恢復力",
      adult: "驚人快速康復力", cyberpunk: "奈米機器人修復", apocalypse: "變異快速再生",
      western_fantasy: "生命魔法自愈", horror: "詭異強制再生",
      palace_intrigue: "秘傳禦醫配方", wasteland: "基因自動修復",
      taiwanese_folk: "符水護體回氣", custom: "快速恢復",
    },
    effect: "每回合結束，HP自動回復3點。",
  },
  {
    id: "nature_bond",
    rarity: "rare",
    names: {
      xian_xia: "御獸天賦靈親", wuxia: "萬獸來朝親和", campus: "動物天才親和力",
      adult: "超強人際親和力", cyberpunk: "AI溝通協議接口", apocalypse: "變異生物交流基因",
      western_fantasy: "馴獸師天賦", horror: "詭異靈體召喚",
      palace_intrigue: "寵物達人魅力", wasteland: "廢土野獸王親和",
      taiwanese_folk: "通靈天賦感應", custom: "天生親和",
    },
    effect: "非人類NPC初始好感+20，特定場景獲得生物/靈體協助。",
  },
  {
    id: "calm_mind",
    rarity: "rare",
    names: {
      xian_xia: "道心堅定如磐", wuxia: "心如止水境界", campus: "沉著冷靜抗壓",
      adult: "商務談判鐵面", cyberpunk: "情緒完全抑制器", apocalypse: "末日鋼鐵神經",
      western_fantasy: "貴族正統教育", horror: "恐懼完全鈍化",
      palace_intrigue: "城府極深謀略", wasteland: "廢土麻木抗壓",
      taiwanese_folk: "煞氣不侵護體", custom: "喜怒不形於色",
    },
    effect: "面對威脅或誘惑時，AI主動提示一個「冷靜選項」。",
  },
  {
    id: "night_walker",
    rarity: "rare",
    names: {
      xian_xia: "夜行靈力感應", wuxia: "夜行輕功身法", campus: "夜貓創造力爆發",
      adult: "夜間工作者本能", cyberpunk: "系統夜間模式", apocalypse: "夜視變異基因",
      western_fantasy: "暗夜精靈之魂", horror: "夜晚感知極化",
      palace_intrigue: "暗夜謀略走位", wasteland: "廢土夜行者",
      taiwanese_folk: "夜巡神將護持", custom: "夜行者",
    },
    effect: "夜晚/深夜場景中，所有行動成功率+15%。",
  },
  {
    id: "silver_tongue",
    rarity: "rare",
    names: {
      xian_xia: "口吐蓮花辯術", wuxia: "江湖百曉生口才", campus: "辯論高手說服力",
      adult: "談判專家說話術", cyberpunk: "社會工程學大師", apocalypse: "末日說客",
      western_fantasy: "魔法口才術", horror: "詭辯混淆術",
      palace_intrigue: "玲瓏話術大家", wasteland: "廢土外交官",
      taiwanese_folk: "神明傳話能力", custom: "能言善道",
    },
    effect: "說服類選擇成功率+20%，部分NPC可被口頭解除敵意。",
  },
  {
    id: "iron_body",
    rarity: "rare",
    names: {
      xian_xia: "肉身強化修煉", wuxia: "鐵布衫金剛體", campus: "體育特長體魄",
      adult: "健身狂人體格", cyberpunk: "骨骼鋼化義體", apocalypse: "變異強化體質",
      western_fantasy: "重甲戰士體魄", horror: "異常耐久生命力",
      palace_intrigue: "武術根底護體", wasteland: "廢土硬漢身板",
      taiwanese_folk: "神力護身加持", custom: "鋼筋鐵骨",
    },
    effect: "HP上限+20，受物理傷害有15%機率減免。",
  },
  {
    id: "sixth_sense",
    rarity: "rare",
    names: {
      xian_xia: "天機感應預警", wuxia: "危機直覺武者感知", campus: "超強直覺反應",
      adult: "商業危機直覺", cyberpunk: "危險預警系統", apocalypse: "求生本能預警",
      western_fantasy: "預知魔法感知", horror: "詭異存在感知",
      palace_intrigue: "政治嗅覺敏銳", wasteland: "廢土老油條感知",
      taiwanese_folk: "神鬼感應靈覺", custom: "危機直覺",
    },
    effect: "進入危險前系統自動提示「[直覺警告：...]」。",
  },
  {
    id: "crafting_genius",
    rarity: "rare",
    names: {
      xian_xia: "煉器鍛造天賦", wuxia: "暗器機關製作", campus: "動手達人創意",
      adult: "創意工程師思維", cyberpunk: "義體改裝大師", apocalypse: "末日廢物改造師",
      western_fantasy: "神器鍛造天才", horror: "詭異工藝手法",
      palace_intrigue: "宮廷頂級工匠", wasteland: "廢土工程師",
      taiwanese_folk: "符籙製作天才", custom: "巧奪天工",
    },
    effect: "製作/改裝場景中品質提升一階，材料消耗-1。",
  },
  {
    id: "shadow_step",
    rarity: "rare",
    names: {
      xian_xia: "縮地成寸靈動", wuxia: "輕功身法精妙", campus: "靈活敏捷身手",
      adult: "行動隱蔽無聲", cyberpunk: "光學迷彩義體", apocalypse: "末日潛行者",
      western_fantasy: "精靈隱形術", horror: "陰影融合消失",
      palace_intrigue: "宮廷無聲行走", wasteland: "廢土潛行幽靈",
      taiwanese_folk: "隱煞消形術", custom: "如影隨形",
    },
    effect: "潛行/逃脫類場景成功率+25%。",
  },
  // ── 普通 (7) ──────────────────────────────────────────────────────────────
  {
    id: "sharp_memory",
    rarity: "common",
    names: {
      xian_xia: "記憶功法修煉", wuxia: "過耳不忘江湖事", campus: "記憶達人技能",
      adult: "清晰工作記憶", cyberpunk: "記憶晶片輔助", apocalypse: "末日情報記憶",
      western_fantasy: "學者博聞強記", horror: "詭異記憶印刻",
      palace_intrigue: "典籍博覽強記", wasteland: "廢土百曉生腦",
      taiwanese_folk: "師傳口訣默記", custom: "記憶力佳",
    },
    effect: "每局開始時，獲得一條關於當前世界的隱藏情報。",
  },
  {
    id: "strong_adaptation",
    rarity: "common",
    names: {
      xian_xia: "辟穀適應修煉", wuxia: "江湖百煉體魄", campus: "健康體質適應",
      adult: "快速環境適應力", cyberpunk: "環境代謝強化", apocalypse: "極端環境適應基因",
      western_fantasy: "旅人吃苦體質", horror: "怪異環境適應力",
      palace_intrigue: "御膳強健體魄", wasteland: "廢土生存適應力",
      taiwanese_folk: "祭品加持體質", custom: "適應力強",
    },
    effect: "消耗類資源（食物/藥品/靈丹）效果額外+1。",
  },
  {
    id: "local_knowledge",
    rarity: "common",
    names: {
      xian_xia: "本地散修情報網", wuxia: "本地江湖消息靈", campus: "校園熟臉人際",
      adult: "本地老油條人脈", cyberpunk: "街區情報員", apocalypse: "廢區地圖腦",
      western_fantasy: "地形熟識老手", horror: "當地傳說通曉",
      palace_intrigue: "宮廷消息靈通", wasteland: "廢土探路老手",
      taiwanese_folk: "廟口消息靈通", custom: "地頭蛇",
    },
    effect: "起始地點附近，隱藏地點/NPC出現率+20%。",
  },
  {
    id: "bargain_skill",
    rarity: "common",
    names: {
      xian_xia: "靈石精打細算", wuxia: "市井砍價高手", campus: "省錢達人技能",
      adult: "精打細算商業眼", cyberpunk: "黑市殺價能力", apocalypse: "末日物資談判",
      western_fantasy: "商人眼光砍價", horror: "詭異等價交換",
      palace_intrigue: "內廷採購經驗", wasteland: "廢土以物換物",
      taiwanese_folk: "廟口討價還價", custom: "討價還價",
    },
    effect: "交易場景中獲得殺價選項，成功可省10~30%資源。",
  },
  {
    id: "thick_skin",
    rarity: "common",
    names: {
      xian_xia: "百嘲不撓道心", wuxia: "江湖厚顏歷練", campus: "抗壓達人心態",
      adult: "打不倒的韌性", cyberpunk: "情緒防火牆設定", apocalypse: "末日心理鈍化",
      western_fantasy: "冒險者打滾心態", horror: "恐懼心理鈍化",
      palace_intrigue: "寵辱不驚宮廷", wasteland: "廢土生存主義",
      taiwanese_folk: "磨練中的法師氣概", custom: "臉皮厚",
    },
    effect: "受到嘲諷/失敗/否定時，壓力值增加減半。",
  },
  {
    id: "diligent",
    rarity: "common",
    names: {
      xian_xia: "苦修勤練不輟", wuxia: "晨練武功日日行", campus: "用功苦讀打基礎",
      adult: "早起工作狂本色", cyberpunk: "高效率程式人生", apocalypse: "末日規律作息",
      western_fantasy: "冒險者晨訓", horror: "詭異應對準備",
      palace_intrigue: "晨省日課宮廷", wasteland: "廢土生存訓練日常",
      taiwanese_folk: "早課誦經不斷", custom: "勤能補拙",
    },
    effect: "黎明/清晨場景，額外獲得一個行動選項。",
  },
  {
    id: "natural_affinity",
    rarity: "common",
    names: {
      xian_xia: "仙緣廣布善緣", wuxia: "俠義天然結緣", campus: "自然親切感染力",
      adult: "親和力十足魅力", cyberpunk: "人格匹配度最佳", apocalypse: "末日倖存者共鳴",
      western_fantasy: "旅人天然緣分", horror: "命運奇異連結",
      palace_intrigue: "宮廷緣分天定", wasteland: "廢土兄弟義氣情",
      taiwanese_folk: "神緣深厚感應", custom: "天生緣分",
    },
    effect: "第一次見面的NPC不會因隨機事件立刻產生敵意。",
  },
];
