const mockArtwork = {
  id: 'test-id-123',
  keyword: 'sunset',
  mood: 'serene',
  artData: '{"seed":123456,"mood":"serene","colors":["#a8d8ea","#aa96da","#fcbad3","#ffffd2"],"shapeType":"circles","complexity":3,"motionSpeed":2,"chaosLevel":2}',
  createdAt: new Date('2024-01-01'),
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    artwork: {
      create: vi.fn().mockResolvedValue(mockArtwork),
    },
  },
}));

vi.mock('@/lib/ai', () => ({
  createMoodAnalyzer: vi.fn().mockReturnValue({
    extractMood: vi.fn().mockResolvedValue({ mood: 'serene' }),
  }),
}));

vi.mock('@/lib/art-generator', () => ({
  generateArtParams: vi.fn().mockReturnValue({
    seed: 123456,
    mood: 'serene',
    colors: ['#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2'],
    backgroundColors: ['#112233'],
    shapeTypes: ['circles'],
    complexity: 3,
    motionSpeed: 2,
    chaosLevel: 2,
    rotationVariance: 45,
    sizeCurve: 0.5,
    positionBias: 'center',
    strokeWidth: 2,
    layerCount: 1,
  }),
  artParamsToJSON: vi.fn().mockReturnValue(
    '{"seed":123456,"mood":"serene","colors":["#a8d8ea","#aa96da","#fcbad3","#ffffd2"],"shapeType":"circles","complexity":3,"motionSpeed":2,"chaosLevel":2}'
  ),
}));
