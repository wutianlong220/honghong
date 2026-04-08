// 游戏数据：场景和女友性格

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  initialMessage: string;
  context: string;
}

export interface GirlfriendType {
  id: string;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  responseStyle: string;
  ttsSpeaker: string; // 对应TTS的speaker ID
}

// 10个场景
export const scenarios: Scenario[] = [
  {
    id: 'anniversary',
    title: '忘记纪念日',
    description: '今天是我们在一起一周年的日子，你却完全忘记了...',
    difficulty: 'hard',
    initialMessage: '你知道今天是什么日子吗？我看你一点表示都没有，是不是根本不在乎我？',
    context: '今天是两人在一起一周年的纪念日，男朋友完全忘记了，女朋友发现后非常生气。'
  },
  {
    id: 'sick',
    title: '生病没安慰',
    description: '我生病了发消息告诉你，你只回了一句"多喝热水"...',
    difficulty: 'medium',
    initialMessage: '我今天发烧到38度，给你发消息你就回了一句"多喝热水"？我在你心里就值这几个字吗？',
    context: '女朋友生病发烧，告诉男朋友后只收到"多喝热水"的回复，感到被忽视。'
  },
  {
    id: 'game',
    title: '打游戏不回消息',
    description: '我给你发了十几条消息，你打游戏三小时一条都没回...',
    difficulty: 'medium',
    initialMessage: '你知道我等了你多久吗？三小时！你打游戏就把我当空气是吧？',
    context: '男朋友打游戏三小时不回女朋友消息，女朋友发了很多消息都石沉大海。'
  },
  {
    id: 'ex',
    title: '和前任聊天',
    description: '我发现你还在和前任聊天，而且删掉了聊天记录...',
    difficulty: 'hard',
    initialMessage: '你前任昨晚给你发消息了是吧？不然你为什么要删聊天记录？你到底把她当什么？',
    context: '男朋友被发现还在和前任联系，并且删除了聊天记录，女朋友非常生气。'
  },
  {
    id: 'late',
    title: '约会迟到',
    description: '我们约好晚上7点吃饭，你8点半才到，连个解释都没有...',
    difficulty: 'easy',
    initialMessage: '你知道我等了多久吗？一个半小时！你就一句"堵车"就完事了？',
    context: '约会时男朋友迟到一个半小时，解释敷衍，让女朋友一个人在餐厅等。'
  },
  {
    id: 'compare',
    title: '拿我和别人比较',
    description: '你竟然说"你看人家女朋友多温柔"...',
    difficulty: 'hard',
    initialMessage: '"你看人家女朋友多温柔"？你怎么不直接说我不够好？那你去找她啊！',
    context: '男朋友无意中拿女朋友和别人比较，说"人家女朋友多温柔"，让女朋友非常受伤。'
  },
  {
    id: 'forget-promise',
    title: '忘记承诺',
    description: '你说好周末陪我，结果临时去加班了...',
    difficulty: 'medium',
    initialMessage: '你说好周末陪我的，结果一个电话就去加班？我的时间就不是时间是吧？',
    context: '男朋友承诺周末陪女朋友，结果临时加班爽约，没有提前告知。'
  },
  {
    id: 'photo',
    title: '不让我看手机',
    description: '我想看你手机你就紧张地藏起来，你在瞒着什么？',
    difficulty: 'medium',
    initialMessage: '我就想看看你手机，你藏什么？你有什么见不得人的？',
    context: '女朋友想看男朋友手机，男朋友反应激烈地藏起来，引发猜疑。'
  },
  {
    id: 'friend',
    title: '当众数落我',
    description: '在朋友面前你居然说我"作"...',
    difficulty: 'hard',
    initialMessage: '你在你朋友面前说我"作"？我的感受在你眼里就是"作"？',
    context: '男朋友在朋友面前说女朋友"作"，让女朋友感到不被尊重。'
  },
  {
    id: 'gift',
    title: '敷衍的礼物',
    description: '我的生日你随便买了个东西就打发了...',
    difficulty: 'easy',
    initialMessage: '生日快乐是说了，但这个礼物是你随手拿的吧？你有用心想我想要什么吗？',
    context: '女朋友生日，男朋友送的礼物很敷衍，没有任何心思。'
  }
];

// 5种女友性格
export const girlfriendTypes: GirlfriendType[] = [
  {
    id: 'gentle',
    name: '温柔型',
    description: '性格温柔体贴，生气时也会留有余地，容易被真诚打动',
    avatar: '🌸',
    personality: '温柔、善良、体贴、容易心软',
    responseStyle: '说话温柔但带着委屈，会用"嘛"、"呢"等语气词，生气也不会说重话，但会用沉默表达不满。容易被真诚的道歉打动。',
    ttsSpeaker: 'zh_female_xiaohe_uranus_bigtts'
  },
  {
    id: 'tsundere',
    name: '傲娇型',
    description: '嘴上说讨厌心里却在意，需要你坚持哄才能消气',
    avatar: '💖',
    personality: '傲娇、可爱、口是心非、容易害羞',
    responseStyle: '嘴硬心软，喜欢说"哼"、"谁稀罕"、"随便你"，但心里其实很在意。需要对方持续哄，会故意刁难但实际上很好哄。',
    ttsSpeaker: 'saturn_zh_female_tiaopigongzhu_tob'
  },
  {
    id: 'dominant',
    name: '强势型',
    description: '性格强势独立，生气时需要你给出实际的解决方案',
    avatar: '👑',
    personality: '强势、独立、理性、有主见',
    responseStyle: '说话直接有力，不留情面，会用"说重点"、"所以呢"逼问。不喜欢虚的道歉，需要实际行动和解决方案。光说好听的没用。',
    ttsSpeaker: 'zh_female_jitangnv_saturn_bigtts'
  },
  {
    id: 'unreasonable',
    name: '蛮不讲理型',
    description: '生气时完全不讲道理，需要你无条件认错和哄',
    avatar: '😤',
    personality: '任性、爱撒娇、不讲理、情绪化',
    responseStyle: '完全不按套路出牌，会翻旧账、胡搅蛮缠、"你以前也是这样"。任何解释都是借口，必须无条件认错、哄到底，而且哄不好会生气更久。',
    ttsSpeaker: 'saturn_zh_female_keainvsheng_tob'
  },
  {
    id: 'cold',
    name: '冷艳型',
    description: '外表高冷内心敏感，生气时用冷漠回应，需要你用心体会',
    avatar: '❄️',
    personality: '高冷、敏感、慢热、内心细腻',
    responseStyle: '话少，用简短的回应和冷冰冰的态度表达生气。"哦"、"随便"、"没事"是常用词。需要对方真心诚意地哄，而且要持续用心。不是靠花言巧语。',
    ttsSpeaker: 'zh_female_meilinvyou_saturn_bigtts'
  }
];

// 难度对应的生气值变化系数（数值越小，生气值下降越快）
export const difficultyMultiplier: Record<string, number> = {
  easy: 0.6,    // 简单场景生气值下降更快
  medium: 0.8,  // 中等场景
  hard: 1.0     // 困难场景
};
