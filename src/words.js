// Original study examples; not an official ETS list or a dictionary extract.
const rows = [
['abundant','adj.','丰富的；大量的','abundant evidence','充分的证据','There is abundant evidence that regular exercise improves sleep.','大量证据表明，规律运动能改善睡眠。','学术'],
['adapt','v.','适应；调整','adapt to change','适应变化','Students need time to adapt to a new learning environment.','学生需要时间适应新的学习环境。','校园'],
['allocate','v.','分配','allocate resources','分配资源','The university will allocate more resources to student support.','大学将向学生支持服务分配更多资源。','学术'],
['ambiguous','adj.','有歧义的；不明确的','ambiguous wording','有歧义的措辞','The ambiguous wording made the survey difficult to answer.','有歧义的措辞让这份问卷很难作答。','学术'],
['analyze','v.','分析','analyze data','分析数据','The researchers will analyze the data before drawing conclusions.','研究人员会先分析数据，再得出结论。','学术'],
['anticipate','v.','预期；预料','anticipate a problem','预料到问题','We did not anticipate such a large increase in demand.','我们没有预料到需求会增加这么多。','日常'],
['approach','n.','方法；途径','a practical approach','切实可行的方法','The instructor suggested a different approach to the problem.','老师建议用另一种方法解决这个问题。','学术'],
['assess','v.','评估','assess the impact','评估影响','The study will assess the impact of noise on learning.','该研究将评估噪声对学习的影响。','学术'],
['assume','v.','假设；认为；承担','assume responsibility','承担责任','We should not assume that every student has a quiet place to study.','我们不应该认为每个学生都有安静的学习场所。','学术'],
['beneficial','adj.','有益的','beneficial effects','有益的影响','Short breaks can be beneficial for concentration.','短暂休息有助于集中注意力。','日常'],
['coherent','adj.','连贯的；条理清楚的','a coherent argument','条理清晰的论证','Each paragraph should contribute to a coherent argument.','每一段都应该服务于条理清晰的论证。','学术'],
['compensate','v.','补偿；弥补','compensate for','弥补','Extra practice can help compensate for a lack of experience.','额外的练习有助于弥补经验不足。','日常'],
['comprehensive','adj.','全面的；综合的','a comprehensive review','全面的回顾','The report provides a comprehensive review of current research.','这份报告全面回顾了当前的研究。','学术'],
['consequence','n.','后果；结果','as a consequence','因此','One consequence of the drought was a sharp rise in food prices.','干旱的一个后果是食品价格大幅上涨。','环境'],
['consistent','adj.','一致的；持续的','consistent with','与……一致','The results are consistent with our earlier findings.','结果与我们先前的发现一致。','学术'],
['constitute','v.','构成；组成','constitute a threat','构成威胁','Plastic waste can constitute a threat to marine life.','塑料垃圾可能对海洋生物构成威胁。','环境'],
['constraint','n.','限制；约束','time constraints','时间限制','Time constraints prevented us from interviewing more participants.','时间限制使我们无法采访更多参与者。','学术'],
['contribute','v.','贡献；促成','contribute to','有助于；导致','Public transportation can contribute to cleaner air.','公共交通有助于改善空气质量。','环境'],
['controversial','adj.','有争议的','a controversial issue','有争议的问题','The proposed policy remains controversial among local residents.','这项拟议政策在当地居民中仍有争议。','社会'],
['conventional','adj.','传统的；常规的','conventional wisdom','普遍看法','The discovery challenged conventional wisdom about animal behavior.','这项发现挑战了人们对动物行为的普遍看法。','学术'],
['crucial','adj.','至关重要的','a crucial role','至关重要的作用','Accurate measurements play a crucial role in this experiment.','准确测量在这项实验中至关重要。','学术'],
['decline','n.','下降；减少','a gradual decline','逐渐下降','The region has seen a decline in rainfall over the past decade.','过去十年，这个地区的降雨量有所减少。','环境'],
['demonstrate','v.','证明；展示','demonstrate the importance','证明重要性','The experiment helped demonstrate how plants respond to light.','这项实验帮助展示了植物如何对光作出反应。','学术'],
['derive','v.','获得；源自','derive from','源自','Many English words derive from Latin.','许多英语单词源自拉丁语。','学术'],
['diminish','v.','减少；减弱','diminish the impact','减轻影响','The noise began to diminish as the traffic moved away.','随着车流远去，噪声开始减弱。','日常'],
['distinct','adj.','不同的；明显的','two distinct groups','两个不同的群体','The study identified two distinct patterns of behavior.','该研究识别出了两种不同的行为模式。','学术'],
['diverse','adj.','多种多样的','diverse perspectives','不同的视角','The discussion brought together students from diverse backgrounds.','这场讨论汇集了来自不同背景的学生。','校园'],
['domestic','adj.','国内的；家庭的','domestic demand','国内需求','Domestic demand for electric vehicles has increased.','国内对电动汽车的需求有所增加。','社会'],
['efficient','adj.','高效的','an efficient system','高效的系统','The new system is more efficient at processing applications.','新系统处理申请的效率更高。','社会'],
['eliminate','v.','消除；排除','eliminate errors','消除错误','Checking the calculations twice can help eliminate errors.','检查两遍计算过程有助于消除错误。','学术'],
['emerge','v.','出现；显现','emerge from','从……出现','A clear pattern began to emerge from the data.','数据中开始显现出清晰的规律。','学术'],
['emphasize','v.','强调','emphasize the importance','强调重要性','The professor emphasized the importance of citing sources.','教授强调了引用来源的重要性。','校园'],
['enhance','v.','增强；改善','enhance performance','提高表现','Getting enough sleep can enhance your ability to concentrate.','充足的睡眠可以增强你的专注能力。','日常'],
['establish','v.','建立；确立','establish a connection','建立联系','The researchers tried to establish a connection between the two events.','研究人员试图确定这两个事件之间的联系。','学术'],
['evaluate','v.','评价；评估','evaluate the effectiveness','评估有效性','We need to evaluate the effectiveness of the new teaching method.','我们需要评估这种新教学方法的有效性。','学术'],
['evident','adj.','明显的','become evident','变得明显','The benefits of regular practice became evident after a month.','规律练习的益处在一个月后变得明显。','日常'],
['expand','v.','扩大；扩展','expand access','扩大使用机会','The library plans to expand access to digital resources.','图书馆计划让更多人能够使用数字资源。','校园'],
['facilitate','v.','促进；使便利','facilitate communication','促进交流','Small group activities can facilitate communication among students.','小组活动可以促进学生之间的交流。','校园'],
['feasible','adj.','可行的','a feasible solution','可行的解决方案','The team is looking for a feasible solution within its budget.','团队正在寻找预算范围内可行的解决方案。','学术'],
['fluctuate','v.','波动','fluctuate widely','大幅波动','Temperatures can fluctuate widely in the desert.','沙漠中的温度可能大幅波动。','环境'],
['fundamental','adj.','根本的；基础的','a fundamental difference','根本区别','There is a fundamental difference between correlation and causation.','相关关系与因果关系之间有根本区别。','学术'],
['generate','v.','产生','generate electricity','发电','Solar panels generate electricity without burning fuel.','太阳能电池板无需燃烧燃料就能发电。','环境'],
['hypothesis','n.','假设','test a hypothesis','检验假设','The team designed an experiment to test its hypothesis.','团队设计了一项实验来检验其假设。','学术'],
['implement','v.','实施；执行','implement a policy','实施政策','The school will implement the new policy next semester.','学校将在下学期实施新政策。','校园'],
['implication','n.','可能的影响；含义','practical implications','实际影响','The findings have important implications for public health.','这些发现对公共健康有重要影响。','学术'],
['incentive','n.','激励；诱因','provide an incentive','提供激励','Lower fares may provide an incentive to use public transport.','更低的票价可能鼓励人们使用公共交通。','社会'],
['indicate','v.','表明；指示','indicate a trend','表明趋势','The survey results indicate a growing interest in online courses.','调查结果表明，人们对在线课程的兴趣正在增加。','学术'],
['inevitable','adj.','不可避免的','an inevitable consequence','不可避免的后果','Some degree of uncertainty is inevitable in scientific research.','科学研究中一定程度的不确定性不可避免。','学术'],
['infer','v.','推断','infer from','从……推断','We cannot infer a causal relationship from these results alone.','仅凭这些结果，我们无法推断存在因果关系。','学术'],
['infrastructure','n.','基础设施','transport infrastructure','交通基础设施','The city needs to invest in its transport infrastructure.','这座城市需要投资交通基础设施。','社会'],
['inhibit','v.','抑制；阻碍','inhibit growth','抑制生长','A lack of sunlight can inhibit plant growth.','阳光不足可能抑制植物生长。','环境'],
['initial','adj.','最初的','an initial assessment','初步评估','Our initial assessment suggests that the project is feasible.','我们的初步评估表明这个项目可行。','学术'],
['interpret','v.','解释；理解','interpret the results','解释结果','Researchers sometimes interpret the same evidence differently.','研究人员有时会对同一证据作出不同解释。','学术'],
['maintain','v.','维持；保持','maintain a balance','保持平衡','It can be difficult to maintain a balance between work and study.','保持工作与学习之间的平衡可能很难。','校园'],
['modify','v.','修改；调整','modify behavior','改变行为','We had to modify our plan because of the weather.','由于天气原因，我们不得不调整计划。','日常'],
['nevertheless','adv.','然而；尽管如此','nevertheless remain','尽管如此仍然','The task was difficult; nevertheless, the team completed it on time.','任务很困难；尽管如此，团队还是按时完成了。','学术'],
['obtain','v.','获得','obtain permission','获得许可','You must obtain permission before recording the interview.','你必须先获得许可，才能录制采访。','学术'],
['perceive','v.','感知；认为','perceive as','将……视为','People may perceive the same situation in different ways.','人们可能以不同方式理解同一种情境。','社会'],
['persistent','adj.','持续的；坚持不懈的','a persistent problem','持续存在的问题','Traffic congestion is a persistent problem in many cities.','交通拥堵是许多城市持续存在的问题。','社会'],
['potential','adj.','潜在的','potential benefits','潜在益处','The report examines the potential benefits of remote work.','报告探讨了远程工作的潜在益处。','社会'],
['precise','adj.','精确的','precise measurements','精确测量','The experiment requires precise measurements of temperature.','这项实验需要精确测量温度。','学术'],
['predominantly','adv.','主要地','predominantly urban','主要为城市的','The survey participants came from predominantly urban areas.','调查参与者主要来自城市地区。','社会'],
['preliminary','adj.','初步的','preliminary findings','初步发现','The preliminary findings need to be confirmed by further research.','这些初步发现需要进一步研究来确认。','学术'],
['preserve','v.','保护；保存','preserve biodiversity','保护生物多样性','Protected areas can help preserve biodiversity.','保护区有助于保护生物多样性。','环境'],
['prioritize','v.','优先处理','prioritize tasks','按优先顺序处理任务','Students often need to prioritize tasks during exam week.','学生在考试周往往需要按优先顺序处理任务。','校园'],
['relevant','adj.','相关的','relevant information','相关信息','Include only information that is relevant to your argument.','只纳入与你的论点相关的信息。','学术'],
['reliable','adj.','可靠的','a reliable source','可靠的来源','A reliable source should explain how its data were collected.','可靠的来源应该解释数据是如何收集的。','学术'],
['require','v.','需要；要求','require attention','需要关注','This course does not require any prior programming experience.','这门课程不要求任何编程经验。','校园'],
['retain','v.','保留；记住','retain information','记住信息','Testing yourself can help you retain information longer.','自我测试有助于你更长久地记住信息。','校园'],
['significant','adj.','显著的；重要的','a significant increase','显著增加','The city reported a significant increase in bicycle use.','该市报告称自行车使用量显著增加。','社会'],
['sufficient','adj.','足够的','sufficient evidence','足够的证据','There is not sufficient evidence to support this claim.','没有足够的证据支持这一说法。','学术'],
['sustainable','adj.','可持续的','sustainable development','可持续发展','The project aims to make farming more sustainable.','该项目旨在提高农业的可持续性。','环境'],
['tendency','n.','倾向；趋势','a tendency to','做……的倾向','People have a tendency to remember unusual events.','人们倾向于记住不同寻常的事件。','社会'],
['undergo','v.','经历；经受','undergo a change','经历变化','The material will undergo a change when heated.','这种材料受热时会发生变化。','学术'],
['valid','adj.','有效的；合理的','a valid reason','合理的理由','The student gave a valid reason for requesting an extension.','这位学生为申请延期给出了合理的理由。','校园'],
['vary','v.','变化；不同','vary considerably','差别很大','Study habits vary considerably from person to person.','每个人的学习习惯差别很大。','校园'],
['whereas','conj.','然而；而','whereas others','而其他人','Some students prefer studying alone, whereas others enjoy group work.','一些学生喜欢独自学习，而另一些喜欢小组合作。','校园'],
['widespread','adj.','广泛的','widespread concern','广泛关注','The proposal has caused widespread concern among residents.','这项提议引起了居民的广泛担忧。','社会'],
['withdraw','v.','退出；撤回','withdraw from a course','退课','Check the deadline before you withdraw from a course.','退课前请查看截止日期。','校园'],
['yield','v.','产生；带来','yield results','产生结果','The first experiment did not yield useful results.','第一次实验没有产生有用的结果。','学术'],
];
export const WORDS = rows.map(([word,pos,meaning,phrase,phraseZh,example,exampleZh,topic]) => ({id:word,word,pos,meaning,phrase,phraseZh,example,exampleZh,topic,decks:['toefl','ielts']}));

WORDS.push(...[
  {
    "id": "affordable",
    "word": "affordable",
    "pos": "adj.",
    "meaning": "负担得起的",
    "phrase": "affordable housing",
    "phraseZh": "经济适用住房",
    "example": "The city needs more affordable housing near public transport.",
    "exampleZh": "这座城市需要在公共交通附近提供更多经济适用住房。",
    "topic": "城市",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "commute",
    "word": "commute",
    "pos": "v.",
    "meaning": "通勤",
    "phrase": "commute to work",
    "phraseZh": "通勤上班",
    "example": "Many residents commute to work by train.",
    "exampleZh": "许多居民乘火车通勤上班。",
    "topic": "城市",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "congestion",
    "word": "congestion",
    "pos": "n.",
    "meaning": "拥堵",
    "phrase": "traffic congestion",
    "phraseZh": "交通拥堵",
    "example": "Better bus services could reduce traffic congestion.",
    "exampleZh": "更好的公交服务可以减少交通拥堵。",
    "topic": "城市",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "renewable",
    "word": "renewable",
    "pos": "adj.",
    "meaning": "可再生的",
    "phrase": "renewable energy",
    "phraseZh": "可再生能源",
    "example": "The region plans to invest in renewable energy.",
    "exampleZh": "该地区计划投资可再生能源。",
    "topic": "环境",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "sanitation",
    "word": "sanitation",
    "pos": "n.",
    "meaning": "公共卫生设施；环境卫生",
    "phrase": "improve sanitation",
    "phraseZh": "改善环境卫生",
    "example": "Clean water and waste collection can improve sanitation.",
    "exampleZh": "清洁用水和垃圾收集可以改善环境卫生。",
    "topic": "城市",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "recycle",
    "word": "recycle",
    "pos": "v.",
    "meaning": "回收利用",
    "phrase": "recycle paper",
    "phraseZh": "回收纸张",
    "example": "Our office encourages staff to recycle paper.",
    "exampleZh": "我们办公室鼓励员工回收纸张。",
    "topic": "环境",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "emission",
    "word": "emission",
    "pos": "n.",
    "meaning": "排放；排放物",
    "phrase": "emission levels",
    "phraseZh": "排放水平",
    "example": "The new buses have lower emission levels.",
    "exampleZh": "新公交车的排放水平更低。",
    "topic": "环境",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "wellbeing",
    "word": "wellbeing",
    "pos": "n.",
    "meaning": "健康与幸福",
    "phrase": "mental wellbeing",
    "phraseZh": "心理健康",
    "example": "Regular breaks can support mental wellbeing.",
    "exampleZh": "定期休息有助于心理健康。",
    "topic": "健康",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "nutrition",
    "word": "nutrition",
    "pos": "n.",
    "meaning": "营养",
    "phrase": "balanced nutrition",
    "phraseZh": "均衡营养",
    "example": "School meals should provide balanced nutrition.",
    "exampleZh": "学校膳食应提供均衡营养。",
    "topic": "健康",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "sedentary",
    "word": "sedentary",
    "pos": "adj.",
    "meaning": "久坐不动的",
    "phrase": "a sedentary lifestyle",
    "phraseZh": "久坐不动的生活方式",
    "example": "A sedentary lifestyle can affect long-term health.",
    "exampleZh": "久坐不动的生活方式可能影响长期健康。",
    "topic": "健康",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "curriculum",
    "word": "curriculum",
    "pos": "n.",
    "meaning": "课程体系",
    "phrase": "the school curriculum",
    "phraseZh": "学校课程体系",
    "example": "Financial education is now part of the school curriculum.",
    "exampleZh": "理财教育现已成为学校课程体系的一部分。",
    "topic": "教育",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "literacy",
    "word": "literacy",
    "pos": "n.",
    "meaning": "读写能力；素养",
    "phrase": "digital literacy",
    "phraseZh": "数字素养",
    "example": "Digital literacy helps people evaluate online information.",
    "exampleZh": "数字素养有助于人们评估网络信息。",
    "topic": "教育",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "vocational",
    "word": "vocational",
    "pos": "adj.",
    "meaning": "职业的",
    "phrase": "vocational training",
    "phraseZh": "职业培训",
    "example": "Vocational training can prepare students for skilled work.",
    "exampleZh": "职业培训可以帮助学生为技术工作做好准备。",
    "topic": "教育",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "tuition",
    "word": "tuition",
    "pos": "n.",
    "meaning": "学费；教学",
    "phrase": "tuition fees",
    "phraseZh": "学费",
    "example": "Some students work part-time to cover tuition fees.",
    "exampleZh": "一些学生通过兼职支付学费。",
    "topic": "教育",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "automation",
    "word": "automation",
    "pos": "n.",
    "meaning": "自动化",
    "phrase": "industrial automation",
    "phraseZh": "工业自动化",
    "example": "Industrial automation has changed the skills workers need.",
    "exampleZh": "工业自动化改变了工人所需的技能。",
    "topic": "技术",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "privacy",
    "word": "privacy",
    "pos": "n.",
    "meaning": "隐私",
    "phrase": "protect privacy",
    "phraseZh": "保护隐私",
    "example": "Clear rules are needed to protect privacy online.",
    "exampleZh": "需要明确的规则来保护网络隐私。",
    "topic": "技术",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "inequality",
    "word": "inequality",
    "pos": "n.",
    "meaning": "不平等",
    "phrase": "income inequality",
    "phraseZh": "收入不平等",
    "example": "The report examines income inequality across regions.",
    "exampleZh": "这份报告研究了不同地区的收入不平等问题。",
    "topic": "社会",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "heritage",
    "word": "heritage",
    "pos": "n.",
    "meaning": "遗产；传统",
    "phrase": "cultural heritage",
    "phraseZh": "文化遗产",
    "example": "The museum helps preserve the town's cultural heritage.",
    "exampleZh": "这座博物馆有助于保护小镇的文化遗产。",
    "topic": "社会",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "volunteer",
    "word": "volunteer",
    "pos": "v.; n.",
    "meaning": "自愿服务；志愿者",
    "phrase": "volunteer work",
    "phraseZh": "志愿工作",
    "example": "Volunteer work can help students understand local needs.",
    "exampleZh": "志愿工作可以帮助学生了解当地需求。",
    "topic": "社会",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "biodiversity",
    "word": "biodiversity",
    "pos": "n.",
    "meaning": "生物多样性",
    "phrase": "protect biodiversity",
    "phraseZh": "保护生物多样性",
    "example": "Restoring wetlands is one way to protect biodiversity.",
    "exampleZh": "恢复湿地是保护生物多样性的一种方式。",
    "topic": "环境",
    "decks": [
      "ielts"
    ]
  },
  {
    "id": "tectonic",
    "word": "tectonic",
    "pos": "adj.",
    "meaning": "地壳构造的",
    "phrase": "tectonic plates",
    "phraseZh": "构造板块",
    "example": "Tectonic plates move slowly over time.",
    "exampleZh": "构造板块随时间缓慢移动。",
    "topic": "地学",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "sediment",
    "word": "sediment",
    "pos": "n.",
    "meaning": "沉积物",
    "phrase": "sediment layers",
    "phraseZh": "沉积层",
    "example": "Sediment layers can reveal changes in an ancient lake.",
    "exampleZh": "沉积层可以揭示古代湖泊的变化。",
    "topic": "地学",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "erosion",
    "word": "erosion",
    "pos": "n.",
    "meaning": "侵蚀",
    "phrase": "soil erosion",
    "phraseZh": "土壤侵蚀",
    "example": "Plant roots can help prevent soil erosion.",
    "exampleZh": "植物根系有助于防止土壤侵蚀。",
    "topic": "地学",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "fossil",
    "word": "fossil",
    "pos": "n.",
    "meaning": "化石",
    "phrase": "the fossil record",
    "phraseZh": "化石记录",
    "example": "The fossil record provides evidence of past life.",
    "exampleZh": "化石记录提供了过去生命存在的证据。",
    "topic": "地学",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "habitat",
    "word": "habitat",
    "pos": "n.",
    "meaning": "栖息地",
    "phrase": "natural habitat",
    "phraseZh": "自然栖息地",
    "example": "Road construction can divide an animal's natural habitat.",
    "exampleZh": "道路建设可能分割动物的自然栖息地。",
    "topic": "生物",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "photosynthesis",
    "word": "photosynthesis",
    "pos": "n.",
    "meaning": "光合作用",
    "phrase": "the rate of photosynthesis",
    "phraseZh": "光合作用速率",
    "example": "Light intensity can affect the rate of photosynthesis.",
    "exampleZh": "光照强度会影响光合作用速率。",
    "topic": "生物",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "organism",
    "word": "organism",
    "pos": "n.",
    "meaning": "生物体",
    "phrase": "a living organism",
    "phraseZh": "一个活的生物体",
    "example": "Every living organism requires a source of energy.",
    "exampleZh": "每个生物体都需要能量来源。",
    "topic": "生物",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "predator",
    "word": "predator",
    "pos": "n.",
    "meaning": "捕食者",
    "phrase": "a natural predator",
    "phraseZh": "天敌",
    "example": "A natural predator can help control the insect population.",
    "exampleZh": "天敌可以帮助控制昆虫种群数量。",
    "topic": "生物",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "mutation",
    "word": "mutation",
    "pos": "n.",
    "meaning": "突变",
    "phrase": "genetic mutation",
    "phraseZh": "基因突变",
    "example": "A genetic mutation may change a protein's structure.",
    "exampleZh": "基因突变可能改变蛋白质的结构。",
    "topic": "生物",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "excavate",
    "word": "excavate",
    "pos": "v.",
    "meaning": "挖掘；发掘",
    "phrase": "excavate a site",
    "phraseZh": "发掘遗址",
    "example": "Archaeologists plan to excavate the site next summer.",
    "exampleZh": "考古学家计划明年夏天发掘该遗址。",
    "topic": "考古",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "artifact",
    "word": "artifact",
    "pos": "n.",
    "meaning": "人工制品；文物",
    "phrase": "an ancient artifact",
    "phraseZh": "一件古代文物",
    "example": "The ancient artifact was found near the river.",
    "exampleZh": "这件古代文物是在河边发现的。",
    "topic": "考古",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "chronology",
    "word": "chronology",
    "pos": "n.",
    "meaning": "年代顺序",
    "phrase": "establish a chronology",
    "phraseZh": "建立年代顺序",
    "example": "The researchers used pottery to establish a chronology.",
    "exampleZh": "研究人员利用陶器建立年代顺序。",
    "topic": "考古",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "civilization",
    "word": "civilization",
    "pos": "n.",
    "meaning": "文明",
    "phrase": "an ancient civilization",
    "phraseZh": "一个古代文明",
    "example": "Trade connected this ancient civilization with distant regions.",
    "exampleZh": "贸易将这个古代文明与遥远地区联系起来。",
    "topic": "历史",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "manuscript",
    "word": "manuscript",
    "pos": "n.",
    "meaning": "手稿",
    "phrase": "an original manuscript",
    "phraseZh": "一份原始手稿",
    "example": "The library keeps the original manuscript in a secure room.",
    "exampleZh": "图书馆将原始手稿存放在一间安全的房间里。",
    "topic": "历史",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "prerequisite",
    "word": "prerequisite",
    "pos": "n.",
    "meaning": "先决条件；先修课",
    "phrase": "a course prerequisite",
    "phraseZh": "一项课程先修要求",
    "example": "Basic statistics is a course prerequisite.",
    "exampleZh": "基础统计学是这门课的先修要求。",
    "topic": "校园",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "syllabus",
    "word": "syllabus",
    "pos": "n.",
    "meaning": "课程大纲",
    "phrase": "the course syllabus",
    "phraseZh": "课程大纲",
    "example": "The course syllabus lists all the assignment deadlines.",
    "exampleZh": "课程大纲列出了所有作业的截止日期。",
    "topic": "校园",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "transcript",
    "word": "transcript",
    "pos": "n.",
    "meaning": "成绩单；文字记录",
    "phrase": "an academic transcript",
    "phraseZh": "一份学业成绩单",
    "example": "The admissions office requested an academic transcript.",
    "exampleZh": "招生办公室要求提供一份学业成绩单。",
    "topic": "校园",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "seminar",
    "word": "seminar",
    "pos": "n.",
    "meaning": "研讨课；研讨会",
    "phrase": "attend a seminar",
    "phraseZh": "参加研讨会",
    "example": "Students will attend a seminar on research methods.",
    "exampleZh": "学生将参加一场有关研究方法的研讨会。",
    "topic": "校园",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "equilibrium",
    "word": "equilibrium",
    "pos": "n.",
    "meaning": "平衡",
    "phrase": "thermal equilibrium",
    "phraseZh": "热平衡",
    "example": "The two objects eventually reach thermal equilibrium.",
    "exampleZh": "这两个物体最终达到热平衡。",
    "topic": "物理",
    "decks": [
      "toefl"
    ]
  },
  {
    "id": "velocity",
    "word": "velocity",
    "pos": "n.",
    "meaning": "速度（含方向）",
    "phrase": "constant velocity",
    "phraseZh": "恒定速度",
    "example": "An object moving at constant velocity has no acceleration.",
    "exampleZh": "以恒定速度运动的物体没有加速度。",
    "topic": "物理",
    "decks": [
      "toefl"
    ]
  }
]);
