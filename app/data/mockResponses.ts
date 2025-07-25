// Mock AI 响应数据 - 流式格式（简化版本，不包含富文本）
export const mockAIResponseStreams = [
  // 销售报告类型
  "好的，这是您要求的2025年第一季度销售数据报告：\n\n一月销售额：120.5万元，同比增长5.2%，主要产品：手机、电脑\n\n二月销售额：110.2万元，同比增长3.1%，主要产品：平板、配件\n\n三月销售额：150.8万元，同比增长8.9%，主要产品：智能手表\n\n总体分析：第一季度业绩表现良好，特别是三月份实现了显著增长。\n\n主要得益于：\n1. 产品创新：新款智能手表广受市场欢迎\n2. 营销策略：精准投放提升了转化率\n3. 渠道拓展：线上线下协同发展\n\n总体来看，业绩表现符合预期，为全年目标奠定了良好基础。",

  // 技术分析类型
  "关于您提到的技术架构问题，我来详细分析一下：\n\n前端架构设计需要考虑以下几个核心方面：\n\n组件化设计：\n- 可复用性：构建通用组件库\n- 维护性：清晰的组件边界和职责\n- 扩展性：支持主题定制和功能扩展\n\n状态管理方案对比：\nRedux：适用于大型应用，可预测性强，但样板代码多\nZustand：适用于中小型应用，轻量简洁，但生态相对小\nContext：适用于简单状态，原生支持，但需考虑性能\n\n性能优化策略包括：\n1. 代码分割：按需加载减少首屏时间\n2. 缓存策略：合理利用浏览器和CDN缓存\n3. 图片优化：WebP格式和懒加载\n\n最终的技术选型需要根据具体业务需求来决定，没有银弹解决方案。",

  // 用户体验类型
  "您提到的用户体验优化确实是个值得深入讨论的话题：\n\nUX设计核心原则：\n\n简洁性原则：\n好的设计应该化繁为简，让用户能够快速理解界面功能，直观地完成目标操作，减少认知负担。\n\n一致性原则：\n保持设计的一致性体现在视觉和交互两个方面。\n\n视觉一致性包括：\n- 统一的色彩规范\n- 一致的字体层级\n- 规范的间距系统\n\n交互一致性包括：\n- 相同操作的反馈效果\n- 统一的导航模式\n- 一致的错误处理\n\n可访问性设计要求：\n视觉：对比度需要达到4.5:1以上\n听觉：视频需要配备字幕支持\n操作：支持键盘导航和Tab顺序优化\n\n记住：设计不仅是美观，更要实用和包容。优秀的UX设计能够显著提升用户满意度和业务转化率。",

  // 项目管理类型
  "关于项目管理的最佳实践，让我分享一些经验：\n\n敏捷开发流程：\n\nSprint规划：\n每个Sprint周期建议控制在2-4周，包含以下环节：\n1. 需求梳理：明确Story和AC\n2. 估点评估：团队共同评估工作量\n3. 任务分配：根据成员专长合理分配\n4. 风险识别：提前发现潜在问题\n\n进度跟踪会议安排：\nDaily Standup：每日15分钟，同步进度和阻塞\nSprint Review：每Sprint 1小时，演示成果\nRetrospective：每Sprint 1小时，总结改进\n\n质量保证措施：\n\n代码质量的保证包括：\n- Code Review：同行评审机制\n- 自动化测试：单元测试加集成测试\n- CI/CD：持续集成和部署\n\n重要提醒：工具是手段，沟通才是核心。再好的方法论也需要团队的有效协作来支撑。",

  // 数据分析类型
  "您的数据分析需求很有意思，让我来帮您梳理一下：\n\n数据分析框架：\n\n数据收集阶段：\n数据来源的多样性是分析准确性的基础。\n\n结构化数据包括：\n- 数据库记录\n- Excel表格\n- API接口数据\n\n半结构化数据包括：\n- JSON日志文件\n- XML配置文件\n- 网页数据\n\n分析维度说明：\n时间维度：关注趋势和周期性，用于预测分析\n用户维度：分析行为轨迹，用于个性化推荐\n产品维度：统计功能使用率，用于产品优化\n地域维度：了解区域分布，用于制定市场策略\n\n可视化展示要求：\n\n好的数据可视化应该：\n- 直观易懂：选择合适的图表类型\n- 突出重点：用颜色和大小强调关键信息\n- 支持交互：允许用户深入探索数据\n\n最终目标是让数据讲故事，为业务决策提供有力支撑。"
];

// 随机选择一个响应流
export function getRandomAIResponseStream(): string {
  const randomIndex = Math.floor(Math.random() * mockAIResponseStreams.length);
  return mockAIResponseStreams[randomIndex];
}

// 根据用户输入返回相关响应流（简单的关键词匹配）
export function getContextualAIResponseStream(userInput: string): string {
  const input = userInput.toLowerCase();
  
  if (input.includes('销售') || input.includes('数据') || input.includes('报告')) {
    return mockAIResponseStreams[0]; // 销售报告
  } else if (input.includes('技术') || input.includes('架构') || input.includes('开发')) {
    return mockAIResponseStreams[1]; // 技术分析
  } else if (input.includes('用户') || input.includes('体验') || input.includes('设计')) {
    return mockAIResponseStreams[2]; // 用户体验
  } else if (input.includes('项目') || input.includes('管理') || input.includes('团队')) {
    return mockAIResponseStreams[3]; // 项目管理
  } else if (input.includes('分析') || input.includes('统计') || input.includes('可视化')) {
    return mockAIResponseStreams[4]; // 数据分析
  }
  
  return getRandomAIResponseStream(); // 默认随机返回
}

// 兼容旧版本 - 返回分块数组
export function getContextualAIResponseChunks(userInput: string): string[] {
  const stream = getContextualAIResponseStream(userInput);
  // 简单分割成小块进行流式传输模拟
  const chunks: string[] = [];
  const chunkSize = 50; // 每个块的字符数
  
  for (let i = 0; i < stream.length; i += chunkSize) {
    chunks.push(stream.substring(i, i + chunkSize));
  }
  
  return chunks;
}

// 兼容旧版本 - 返回完整响应字符串
export function getContextualAIResponse(userInput: string): string {
  return getContextualAIResponseStream(userInput);
}

// 模拟流式数据传输 - 模仿 1-1.html 的数据传输方式
export function simulateStreamData(userInput: string, onChunk: (chunk: string) => void, onComplete: () => void) {
  const stream = getContextualAIResponseStream(userInput);
  const chunkSize = 30; // 每次发送的字符数
  let index = 0;
  
  const interval = setInterval(() => {
    if (index < stream.length) {
      const chunk = stream.substring(index, Math.min(index + chunkSize, stream.length));
      onChunk(chunk);
      index += chunkSize;
    } else {
      clearInterval(interval);
      onComplete();
    }
  }, 200); // 每200ms发送一个chunk，模拟网络传输延迟
} 