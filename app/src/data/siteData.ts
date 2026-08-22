export interface Scholar {
  id: string;
  name: string;
  nameCn?: string;
  institution: string;
  institutionCn?: string;
  country: string;
  fields: string[];
  bio: string;
  highlight: string;
  homepage: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  language: string;
  tag: string;
}

export interface ResourceCategory {
  key: string;
  label: string;
  icon: string;
  items: Resource[];
}

export const scholarsData: Scholar[] = [
  {
    id: "carle-pieters",
    name: "Carle M. Pieters",
    nameCn: "卡尔·皮特斯",
    institution: "Brown University",
    institutionCn: "布朗大学",
    country: "USA",
    fields: ["行星遥感", "光谱学", "表面成分分析"],
    bio: "国际著名的行星遥感专家，长期致力于行星表面光谱学研究，在月球和水星表面矿物成分分析方面做出了开创性贡献。",
    highlight: "Moon Mineralogy Mapper（M3）首席科学家",
    homepage: "https://www.brown.edu/"
  },
  {
    id: "maria-zuber",
    name: "Maria T. Zuber",
    nameCn: "玛丽亚·祖伯",
    institution: "MIT",
    institutionCn: "麻省理工学院",
    country: "USA",
    fields: ["行星重力场", "内部结构", "地形测量"],
    bio: "行星重力场与内部结构研究的领军人物，领导了多个行星探测任务的重力场实验，包括 GRAIL（月球）和 Mars Gravity（火星）。",
    highlight: "GRAIL 任务首席科学家",
    homepage: "https://eapsweb.mit.edu/"
  },
  {
    id: "sara-seager",
    name: "Sara Seager",
    nameCn: "萨拉·西格",
    institution: "MIT",
    institutionCn: "麻省理工学院",
    country: "USA",
    fields: ["系外行星", "大气光谱", "宜居性"],
    bio: "系外行星大气与宜居性研究的先驱，提出的系外行星大气光谱分析方法已成为该领域的标准技术。",
    highlight: "《系外行星大气》专著作者",
    homepage: "https://www.mit.edu/"
  },
  {
    id: "lin-yangting",
    name: "林杨挺",
    nameCn: "林杨挺",
    institution: "中国科学院地质与地球物理研究所",
    country: "China",
    fields: ["陨石学", "宇宙化学", "同位素年代学"],
    bio: "长期从事陨石学与宇宙化学研究，在前太阳颗粒、陨石分类和太阳系早期演化方面做出了重要贡献。",
    highlight: "中国陨石学研究奠基人之一",
    homepage: "http://www.igg.cas.cn/"
  },
  {
    id: "li-chunlai",
    name: "李春来",
    nameCn: "李春来",
    institution: "中国科学院国家天文台",
    country: "China",
    fields: ["月球遥感", "行星探测", "地质制图"],
    bio: "中国月球与深空探测工程的重要科学家，领导了嫦娥系列任务的遥感科学工作，在月球形貌与地质研究方面成果卓著。",
    highlight: "嫦娥任务遥感科学团队负责人",
    homepage: "http://www.nao.cas.cn/"
  },
  {
    id: "hui-hejiu",
    name: "惠鹤九",
    nameCn: "惠鹤九",
    institution: "南京大学",
    country: "China",
    fields: ["行星形成", "太阳系演化", "地球化学"],
    bio: "长期从事行星形成与太阳系早期演化研究，在行星分馏过程和同位素体系方面有深入研究。",
    highlight: "行星科学教育先驱",
    homepage: "https://www.nju.edu.cn/"
  },
  {
    id: "xiao-long",
    name: "肖龙",
    nameCn: "肖龙",
    institution: "中国地质大学（武汉）",
    country: "China",
    fields: ["行星地质学", "火星地质", "撞击坑"],
    bio: "长期从事行星地质学研究，在火星表面过程、撞击坑年代学和月球地质方面成果丰富。",
    highlight: "火星地质研究专家",
    homepage: "https://www.cug.edu.cn/"
  },
  {
    id: "james-kasting",
    name: "James F. Kasting",
    nameCn: "詹姆斯·卡斯廷",
    institution: "Pennsylvania State University",
    institutionCn: "宾夕法尼亚州立大学",
    country: "USA",
    fields: ["行星宜居性", "大气演化", "气候模拟"],
    bio: "行星宜居性研究的奠基人之一，提出了著名的「宜居带」概念，为系外行星宜居性评估奠定了理论基础。",
    highlight: "宜居带概念提出者",
    homepage: "https://www.eesi.psu.edu/"
  },
  {
    id: "jonathan-lunine",
    name: "Jonathan I. Lunine",
    nameCn: "乔纳森·卢宁",
    institution: "Cornell University",
    institutionCn: "康奈尔大学",
    country: "USA",
    fields: ["行星形成", "卫星科学", "天体生物学"],
    bio: "长期从事行星形成理论和卫星科学研究，在木星系统和土卫六研究方面有重要贡献。",
    highlight: "《行星科学导论》作者",
    homepage: "https://www.cornell.edu/"
  },
  {
    id: "anny-levasseur",
    name: "Anny-Chantal Levasseur-Regourd",
    nameCn: "安妮-尚塔尔·勒瓦瑟-勒古尔",
    institution: "Sorbonne University",
    institutionCn: "索邦大学",
    country: "France",
    fields: ["彗星", "尘埃", "太阳系小天体"],
    bio: "长期从事彗星和星际尘埃研究，在罗塞塔任务中发挥了重要作用。",
    highlight: "罗塞塔任务科学团队成员",
    homepage: "https://www.sorbonne-universite.fr/"
  }
];

export const resourcesData: ResourceCategory[] = [
  {
    key: "databases",
    label: "数据库",
    icon: "database",
    items: [
      { id: "pds", name: "PDS (Planetary Data System)", description: "NASA 行星数据系统，存储和管理太阳系探测任务的数据，包括轨道数据、遥感影像、光谱数据等。", url: "https://pds.nasa.gov", language: "英文", tag: "官方" },
      { id: "isis", name: "ISIS (USGS)", description: "USGS 开发的行星遥感数据处理软件套件，支持图像处理、几何校正、数据融合。", url: "https://isis.astrogeology.usgs.gov", language: "英文", tag: "工具" },
      { id: "jmars", name: "JMARS", description: "亚利桑那州立大学开发的行星地理信息系统，支持多行星数据可视化与分析。", url: "https://jmars.asu.edu", language: "英文", tag: "工具" },
      { id: "hirise", name: "HiRISE", description: "火星高分辨率成像科学实验数据网站，最高分辨率 0.25 m/像素。", url: "https://www.uahirise.org", language: "英文", tag: "数据" },
      { id: "lroc", name: "LROC WMS", description: "月球勘测轨道器相机数据服务，提供全月球高分辨率影像与地形数据。", url: "https://wms.lroc.asu.edu", language: "英文", tag: "数据" },
      { id: "astropedia", name: "Astropedia", description: "USGS 天体地质学搜索门户，集成地图、数据、影像、出版物。", url: "https://astrogeology.usgs.gov/search", language: "英文", tag: "门户" }
    ]
  },
  {
    key: "tools",
    label: "工具",
    icon: "tools",
    items: [
      { id: "spice", name: "SPICE Toolkit", description: "NASA 导航与 Ancillary 信息工具包，用于行星探测任务的时空计算。", url: "https://naif.jpl.nasa.gov/naif/toolkit.html", language: "英文", tag: "开发" },
      { id: "gdal", name: "GDAL", description: "地理空间数据抽象库，支持多种行星数据格式。", url: "https://gdal.org", language: "英文", tag: "开源" },
      { id: "qgis", name: "QGIS", description: "开源地理信息系统，支持 PDS 数据导入与可视化。", url: "https://qgis.org", language: "英文", tag: "开源" },
      { id: "nasaview", name: "NASAView", description: "NASA PDS 数据查看工具，支持多种行星科学数据格式。", url: "https://nasaview.fh-aachen.de", language: "英文", tag: "工具" },
      { id: "crism", name: "CRISM Analysis Toolkit", description: "火星高光谱数据分析工具，支持矿物识别与光谱解译。", url: "https://pds-geosciences.wustl.edu", language: "英文", tag: "工具" }
    ]
  },
  {
    key: "journals",
    label: "期刊",
    icon: "book",
    items: [
      { id: "epsl", name: "Earth and Planetary Science Letters", description: "地球与行星科学快报，高影响力综合期刊，涵盖行星科学的广泛领域。", url: "https://www.sciencedirect.com/journal/earth-and-planetary-science-letters", language: "英文", tag: "顶刊" },
      { id: "jgr-planets", name: "Journal of Geophysical Research: Planets", description: "地球物理研究杂志：行星分册，行星科学领域的权威期刊。", url: "https://agupubs.onlinelibrary.wiley.com/journal/21699100", language: "英文", tag: "权威" },
      { id: "icarus", name: "Icarus", description: "国际行星科学权威期刊，发表太阳系研究的原创性成果。", url: "https://www.sciencedirect.com/journal/icarus", language: "英文", tag: "权威" },
      { id: "psj", name: "Planetary Science Journal", description: "美国天文学会行星科学期刊，开放获取，涵盖行星科学的各个领域。", url: "https://iopscience.iop.org/journal/2632-3338", language: "英文", tag: "开放" },
      { id: "maps", name: "Meteoritics & Planetary Science", description: "陨石学与行星科学期刊，聚焦陨石分析和行星物质研究。", url: "https://onlinelibrary.wiley.com/journal/19455100", language: "英文", tag: "专业" },
      { id: "nat-astro", name: "Nature Astronomy", description: "自然天文学，顶级综述期刊，涵盖天文学与行星科学前沿。", url: "https://www.nature.com/natastron/", language: "英文", tag: "顶刊" }
    ]
  },
  {
    key: "conferences",
    label: "会议",
    icon: "calendar",
    items: [
      { id: "lpsc", name: "LPSC", description: "月球与行星科学年会，行星科学领域最大学术会议，每年在美国休斯顿举办。", url: "https://www.hou.usra.edu/meetings/lpsc", language: "英文", tag: "年会" },
      { id: "agu", name: "AGU Fall Meeting", description: "美国地球物理联合会秋季会议，行星科学的重要交流平台。", url: "https://www.agu.org", language: "英文", tag: "年会" },
      { id: "egu", name: "EGU General Assembly", description: "欧洲地球科学联盟年会，欧洲最大的地球与行星科学会议。", url: "https://www.egu.eu", language: "英文", tag: "年会" },
      { id: "epsc", name: "Europlanet Science Congress", description: "欧洲行星科学大会，欧洲行星科学学会主办的年度会议。", url: "https://www.europlanet-society.org", language: "英文", tag: "年会" },
      { id: "dps", name: "DPS", description: "美国天文学会行星科学分会年会，北美行星科学的核心会议。", url: "https://dps.aas.org", language: "英文", tag: "年会" }
    ]
  },
  {
    key: "education",
    label: "教育",
    icon: "graduation-cap",
    items: [
      { id: "psi", name: "Planetary Science Institute", description: "行星科学研究所，提供丰富的教育与公众资源，包括在线课程和科普材料。", url: "https://www.psi.edu", language: "英文", tag: "教育" },
      { id: "open-uni", name: "Open University Planetary Science", description: "开放大学行星科学课程，提供免费的在线学习资源。", url: "https://www.open.ac.uk", language: "英文", tag: "课程" },
      { id: "nasa-sse", name: "NASA Solar System Exploration", description: "NASA 太阳系探索官方资源，提供任务介绍、图像库和教育材料。", url: "https://solarsystem.nasa.gov", language: "英文", tag: "科普" },
      { id: "planetary-society", name: "Planetary Society", description: "行星学会，全球最大的行星科学爱好者组织，提供新闻、播客和教育资源。", url: "https://www.planetary.org", language: "英文", tag: "组织" },
      { id: "nine-planets", name: "Nine Planets", description: "行星科学科普网站，提供太阳系天体的详细介绍和数据。", url: "https://nineplanets.org", language: "英文", tag: "科普" }
    ]
  }
];

export const navItems = [
  { label: "首页", href: "/" },
  { label: "学科知识", href: "/knowledge/", children: [
    { label: "数学物理方法", href: "/knowledge/math-physics/" },
    { label: "回归分析", href: "/knowledge/regression/" },
    { label: "宇宙化学", href: "/knowledge/cosmochemistry/" },
    { label: "行星科学基础", href: "/knowledge/planetary-basics/" },
    { label: "地球物理学", href: "/knowledge/geophysics/" },
    { label: "遥感技术", href: "/knowledge/remote-sensing/" }
  ]},
  { label: "学者信息", href: "/scholars/" },
  { label: "外部资源", href: "/resources/" },
  { label: "关于我们", href: "/about/" }
];

export const knowledgeCards = [
  { icon: "📐", title: "数学物理方法", desc: "偏微分方程、特殊函数、复变函数在行星科学中的应用", href: "/knowledge/math-physics/" },
  { icon: "📊", title: "回归分析", desc: "统计方法、数据分析与机器学习在行星探测中的应用", href: "/knowledge/regression/" },
  { icon: "🧪", title: "宇宙化学", desc: "元素起源、太阳系化学演化、陨石分析", href: "/knowledge/cosmochemistry/" },
  { icon: "🪐", title: "行星科学基础", desc: "行星形成、内部结构、大气演化与表面过程", href: "/knowledge/planetary-basics/" },
  { icon: "🌍", title: "地球物理学", desc: "地球物理探测方法、重力场、磁场与地震学", href: "/knowledge/geophysics/" },
  { icon: "🛰️", title: "遥感技术", desc: "行星遥感、光谱分析、成像与数据处理", href: "/knowledge/remote-sensing/" }
];
