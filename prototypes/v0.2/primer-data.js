/* 小骨宝 OsteoPal · 疾病概要数据（36 号）
 * 口径：docs/DISEASE-PRIMER.md；规范：starter docs/36-DISEASE-PRIMER.md。
 * 全部内容属第 ② 层（解释）：只写定义、文件、指南列举过的手段、已发生的变化。
 * 任何「你该怎么办」的判断都不在这里，固定出口是「这一句需要问你的医生」。
 *
 * 原件状态照实写：NCCN Bone Cancer 全文未取得（2.2025 存在见 JNCCN 2025;13(4):e250017，
 * 现行版本号未核实）；CSCO《骨与软组织肿瘤诊疗指南 2025》官网直链未取得，据二次发布报道；
 * 卫健委《86 个罕见病病种诊疗指南（2025 年版）》含骨肉瘤 / 尤文肉瘤 / 骨巨细胞瘤单病种指南，
 * 本表只引用其「存在与覆盖」这一层，不复制临床条文。
 * CT.gov 检索数字为本项目 2026-11-10 API v2 实测（一手自采）。
 */
window.DISEASE_PRIMER = {
  brand: '小骨宝 OsteoPal',
  name: '骨癌（骨原发恶性肿瘤）',
  en: 'Bone Cancer (Primary Malignant Bone Tumors)',
  updated: '2026-11-11',
  sections: [
    {
      id: 'definition',
      title: '定义',
      intro: '骨原发恶性肿瘤是起源于骨组织的恶性肿瘤，常见类型有骨肉瘤、软骨肉瘤、尤文肉瘤等；'
        + '骨巨细胞瘤是原发于骨骼的交界性肿瘤（卫健委 2025 年版指南口径）。这台工作台把「医生给的是哪一期、凭什么定的」放在第一位，'
        + '因为治疗路径先按病理类型与外科分期分岔：先化疗还是先手术、保肢还是截肢。',
      points: [
        '骨肉瘤是最常见的原发恶性骨肿瘤，好发于青少年与年轻成人的长骨干骺端（如股骨远端、胫骨近端、肱骨近端）。',
        '确诊靠「临床 + 影像 + 病理」三结合；治疗前必须活检获取组织学诊断，首选穿刺活检（NHC 2025 口径）。',
        '分期用 Enneking 外科分期（G 分级 / T 范围 / M 转移）；AJCC 第 9 版骨肿瘤章节滚动更新中。本台只记录医生给出的期别，不自算。',
        '骨转移癌（其他器官的癌转移到骨）不属本台范围。'
      ],
      sources: [
        { org: '国家卫健委', doc: '《86 个罕见病病种诊疗指南（2025 年版）》骨肉瘤 / 尤文肉瘤 / 骨巨细胞瘤分册', version: '2025 年版', original: false, page: '页码待核',
          secondaryUrl: 'https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml', note: '官网目录页（官方入口）；单病种 PDF 原件未下载，据目录页与转载页' },
        { org: 'NCCN', doc: 'NCCN Guidelines · Bone Cancer', version: '2.2025（现行版本号未核实）', original: false, page: '页码待核',
          secondaryUrl: 'https://pubmed.ncbi.nlm.nih.gov/40203873', note: '2.2025 存在性见 JNCCN 2025;13(4):e250017；全文未取得' }
      ]
    },
    {
      id: 'evidence',
      title: '医学资料规范和指南情况',
      intro: '这台工作台里出现的每一条「查什么、分期怎么记、多久随访」，都应能追到下面某一份文件。'
        + '本项目对主要指南只核对到「存在」这一层，全文未取得，版本号不写死。',
      table: {
        head: ['机构', '文件', '版本 / 年份', '原件', '本台的用途'],
        rows: [
          ['国家卫健委', '《86 个罕见病病种诊疗指南（2025 年版）》骨肉瘤 / 尤文肉瘤 / 骨巨细胞瘤分册', '2025 年版', { text: '未取得原件，据官网目录页', url: 'https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml' }, '中文定义、确诊路径（穿刺活检为先）与随访口径的对照'],
          ['CSCO', 'CSCO 骨与软组织肿瘤诊疗指南', '2025（官网直链未核实）', { text: '未取得原件，据二次发布报道', url: 'https://bydrug.pharmcube.com/news/detail/80bc7aa819ee2ab3192d5099a40de05d' }, '国内路径与药物可及性对照；本版不作引用依据'],
          ['NCCN', 'NCCN Guidelines · Bone Cancer', '2.2025（现行版本号未核实）', { text: '未取得原件，据 JNCCN 文献', url: 'https://pubmed.ncbi.nlm.nih.gov/40203873' }, '国际路径结构对照；本版不作引用依据'],
          ['AJCC', 'AJCC Cancer Staging Manual Version 9（骨肿瘤章节滚动更新）', 'v9', { text: '未取得章节原文，据官网页', url: 'https://www.facs.org/quality-programs/cancer-programs/american-joint-committee-on-cancer/version-9' }, '分期体系命名口径']
        ]
      },
      points: [
        '指南给的是「通常怎么做」，不是「你该怎么做」；本台引用一律带机构与版本，查不到版本就写「版本未核实」。',
        '未取得原件的文件只记「存在」与「大致讲什么」，不引用其具体条文，页码写「页码待核」。',
        '中国官方级来源优先：流行病学与诊疗口径以卫健委指南为准；药物适应证以 NMPA 批件为准（本台未收录任何「骨肉瘤适应证」药物主张——安罗替尼获批适应证为软组织肉瘤，不含骨肉瘤）。'
      ],
      sources: [
        { org: '国家卫健委', doc: '《86 个罕见病病种诊疗指南（2025 年版）》', version: '2025 年版', original: false, page: '页码待核',
          secondaryUrl: 'https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml', note: '官网目录页（官方入口）' },
        { org: 'CSCO', doc: 'CSCO 骨与软组织肿瘤诊疗指南', version: '2025', original: false, page: '页码待核',
          secondaryUrl: 'https://bydrug.pharmcube.com/news/detail/80bc7aa819ee2ab3192d5099a40de05d', note: '二次发布报道；官网直链未核实，不据此引用' }
      ]
    },
    {
      id: 'landscape',
      title: '目前治疗全景概要',
      intro: '下面按病期与线序列出指南里出现过的手段类别。这是「世界上大致有哪些办法」的地图，不是给你排的先后顺序，'
        + '也不含剂量、疗程与适用条件——那些必须由医生按你的病理类型与分期决定。',
      groups: [
        {
          label: '确诊与术前',
          points: [
            '活检：穿刺活检是首选（通道设计会与最终手术统筹，由骨肿瘤专科做）。',
            '新辅助化疗：高级别骨肉瘤确诊后通常先做化疗（大剂量甲氨蝶呤、多柔比星、顺铂等组合，方案按医嘱原文）。',
            '分期评估：局部 MRI + 胸部 CT（骨肉瘤转移几乎只看肺）等，按医生安排。'
          ]
        },
        {
          label: '手术',
          points: [
            '保肢手术：在肿瘤反应区外广泛切除，多数四肢骨肉瘤可以保肢；重建常用肿瘤型人工假体。',
            '截肢：无法获得安全边界时的选择；这是医生当面讨论的决定，本台不做判断。',
            '骨巨细胞瘤：刮除 + 重建为主（交界性肿瘤，与恶性肿瘤路径不同）。'
          ]
        },
        {
          label: '术后与复发 / 转移后',
          points: [
            '辅助化疗：术后按方案继续（是否做、做几个周期由医生定）。',
            '复发 / 转移后：手术、化疗、靶向等手段在不同情形下被列出；本台不写具体药物主张。',
            '临床研究：指南把「参加登记良好的临床试验」列为一项正式选项，不是最后手段。'
          ]
        },
        {
          label: '贯穿全程的两件事',
          points: [
            '功能与假体随访：保肢术后的肢体功能由医生评估（如 MSTS 评分）；本台只记录本人自述与报告摘录。',
            '随访节律：中文指南口径为术后第 1–2 年每 3 个月、逐渐拉长（【待核：原件 PDF 逐条】）；胸 CT 是肺转移监测的首选。本台只把「约在哪天、做了没有」整理成时间线。'
          ]
        }
      ],
      points: [
        '以上是文献与指南里列出的手段，按病期与线序排列，不代表任何一项适合你。选哪一个，这一句需要问你的医生。'
      ],
      sources: [
        { org: '国家卫健委', doc: '《86 个罕见病病种诊疗指南（2025 年版）》骨肉瘤分册', version: '2025 年版', original: false, page: '页码待核',
          secondaryUrl: 'https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml', note: '官网目录页（官方入口）' },
        { org: '《经典型骨肉瘤诊疗指南》', doc: '中文存档 PDF', version: '2021', original: false, page: '页码待核',
          secondaryUrl: 'https://njguloulib.yuntsg.com/ueditor/jsp/upload/file/20210608/1623115700638048095.pdf', note: '二次来源（图书馆存档件）；随访节律与肺转出口径参照' }
      ]
    },
    {
      id: 'trend',
      title: '发展趋势',
      intro: '这一段只写已经发生的事：哪一版指南生效、登记平台上检索到多少条、哪个渠道查不到。不写预测，不做评价。',
      points: [
        '2025 年：国家卫健委发布《86 个罕见病病种诊疗指南（2025 年版）》，含骨肉瘤、尤文肉瘤、骨巨细胞瘤单病种指南。',
        '2025 年：CSCO 发布《骨与软组织肿瘤诊疗指南 2025》（据二次发布报道，官网直链未核实）。',
        'NCCN Bone Cancer 从 2.2025（JNCCN 2025;13(4):e250017）继续更新，现行版本号未核实。',
        '截至 2026-11-10：ClinicalTrials.gov 以 query.cond=osteosarcoma、query.locn=China 检索到 87 项登记（其中招募中 19 项，API v2 实测）；本台演示摘录其中 6 条，状态未核实。',
        'ChiCTR / 药物临床试验登记平台本轮未采集，中国登记覆盖数未知。'
      ],
      sources: [
        { org: 'ClinicalTrials.gov', doc: 'API v2 检索（query.cond=osteosarcoma；query.locn=China；2026-11-10 实测）', version: '检索日 2026-11-10', original: true, nolink: true, note: '一手登记数据，本项目自采；快照存 research/bone-cancer/（M4 采集后），无公开 URL' },
        { org: '国家卫健委', doc: '《86 个罕见病病种诊疗指南（2025 年版）》目录页', version: '2025 年版', original: false, page: '—',
          secondaryUrl: 'https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml', note: '官方入口' }
      ]
    }
  ]
}
