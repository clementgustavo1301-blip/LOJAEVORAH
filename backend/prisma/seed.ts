import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do Catálogo de Joias em Aço Inoxidável ---');

  // Limpeza
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Categorias
  const catAneis = await prisma.category.create({
    data: {
      name: 'Anéis',
      slug: 'aneis',
      description: 'Anéis forjados em Aço Cirúrgico 316L de alta precisão e acabamento manual.',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catCorrentes = await prisma.category.create({
    data: {
      name: 'Correntes',
      slug: 'correntes',
      description: 'Correntes com elos maciços, fechos de segurança e alta durabilidade.',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catCordoes = await prisma.category.create({
    data: {
      name: 'Cordões',
      slug: 'cordoes',
      description: 'Cordões trançados baianos e elos singulares para uso diário.',
      imageUrl: 'https://images.unsplash.com/photo-1611591475870-760f38b2585f?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catPingentes = await prisma.category.create({
    data: {
      name: 'Pingentes',
      slug: 'pingentes',
      description: 'Símbolos contemporâneos em relevo e acabamento laser em aço cirúrgico.',
      imageUrl: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catPulseiras = await prisma.category.create({
    data: {
      name: 'Pulseiras',
      slug: 'pulseiras',
      description: 'Braceletes e pulseiras em elos robustos com fechos mecânicos lapidados.',
      imageUrl: 'https://images.unsplash.com/photo-1611591475879-7153b664d50d?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catBrincos = await prisma.category.create({
    data: {
      name: 'Brincos',
      slug: 'brincos',
      description: 'Argolas articuladas hipoalergênicas que nunca perdem o brilho.',
      imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catAcessorios = await prisma.category.create({
    data: {
      name: 'Acessórios',
      slug: 'acessorios',
      description: 'Prendedores, carteiras e complementos monolíticos masculinos e femininos.',
      imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
    },
  });

  // Produtos
  const products = [
    {
      name: 'Corrente Grumet Diamond Cut 6mm',
      slug: 'corrente-grumet-diamond-cut-6mm',
      description: 'Corrente em aço inoxidável 316L com elos Grumet chanfrados com corte diamantado. Brilho espelhado que reflete a luz com precisão geométrica. Fecho gaveta duplo de alta segurança.',
      specifications: 'Material: Aço Cirúrgico 316L | Espessura: 6mm | Fecho: Gaveta duplo | Peso médio: 48g | À prova d’água e suor.',
      careInstructions: 'Lavar com água corrente e sabão neutro. Secar com flanela de microfibra.',
      price: 189.90,
      promotionalPrice: 159.90,
      rating: 4.9,
      reviewsCount: 142,
      isNew: false,
      isBestSeller: true,
      isFeatured: true,
      categoryId: catCorrentes.id,
      availableFinishes: JSON.stringify(['silver', 'gold', 'black', 'bicolor']),
      availableSizes: JSON.stringify(['50cm', '60cm', '70cm']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611591475870-760f38b2585f?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      name: 'Anel Monolítico Quadrado Chanfrado',
      slug: 'anel-monolitico-quadrado-chanfrado',
      description: 'Anel de topo reto geométrico, forjado em bloco maciço de aço inoxidável. Perfil anatômico interno para conforto superior durante o dia inteiro.',
      specifications: 'Material: Aço Cirúrgico 316L | Largura do topo: 14mm | Acabamento: Polido e lateral escovada | Anatômico.',
      careInstructions: 'Não risca com facilidade e suporta contato diário com água e produtos de higiene.',
      price: 129.90,
      promotionalPrice: 99.90,
      rating: 4.8,
      reviewsCount: 96,
      isNew: true,
      isBestSeller: true,
      isFeatured: true,
      categoryId: catAneis.id,
      availableFinishes: JSON.stringify(['silver', 'gold', 'black']),
      availableSizes: JSON.stringify(['16', '18', '20', '22', '24', '26']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      name: 'Pingente Cruz Minimalista Chanfrada',
      slug: 'pingente-cruz-minimalista-chanfrada',
      description: 'Design escultural contemporâneo de proporções equilibradas. Arestas lapidadas à mão que realçam a reflexão do aço cirúrgico.',
      specifications: 'Material: Aço Cirúrgico 316L | Altura: 32mm | Largura: 18mm | Passador compatível até 7mm.',
      careInstructions: 'Garantia permanente contra oxidação e manchas.',
      price: 89.90,
      promotionalPrice: 69.90,
      rating: 4.9,
      reviewsCount: 88,
      isNew: false,
      isBestSeller: true,
      isFeatured: true,
      categoryId: catPingentes.id,
      availableFinishes: JSON.stringify(['silver', 'gold', 'black']),
      availableSizes: JSON.stringify(['Único']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      name: 'Corrente Elo Português Circular 4mm',
      slug: 'corrente-elo-portugues-circular-4mm',
      description: 'Elos redondos entrelaçados em acabamento PVD Ouro 18k e Aço Polido. Toque macio e caimento fluido ideal para composições.',
      specifications: 'Material: Aço Cirúrgico 316L com revestimento PVD Íon | Espessura: 4mm | Fecho: Lagosta reforçado.',
      careInstructions: 'Banho PVD a vácuo com resistência 10x superior aos banhos convencionais.',
      price: 159.90,
      promotionalPrice: null,
      rating: 4.7,
      reviewsCount: 54,
      isNew: true,
      isBestSeller: false,
      isFeatured: true,
      categoryId: catCorrentes.id,
      availableFinishes: JSON.stringify(['silver', 'gold', 'bicolor']),
      availableSizes: JSON.stringify(['45cm', '50cm', '60cm']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      name: 'Brinco Argola Articulada Click 14mm',
      slug: 'brinco-argola-articulada-click-14mm',
      description: 'Par de argolas em perfil quadrado minimalista com fecho click articulado. Totalmente hipoalergênicas, perfeitas para uso contínuo.',
      specifications: 'Material: Aço 316L Cirúrgico | Diâmetro externo: 14mm | Espessura: 2.5mm | Hipoalergênico.',
      careInstructions: 'Pode molhar na piscina e no mar sem risco de desbotar.',
      price: 69.90,
      promotionalPrice: 49.90,
      rating: 5.0,
      reviewsCount: 167,
      isNew: false,
      isBestSeller: true,
      isFeatured: true,
      categoryId: catBrincos.id,
      availableFinishes: JSON.stringify(['silver', 'gold', 'black']),
      availableSizes: JSON.stringify(['12mm', '14mm', '16mm']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      name: 'Pulseira Grumet Fecho Gaveta Lapidado',
      slug: 'pulseira-grumet-fecho-gaveta-lapidado',
      description: 'Pulseira robusta de elos grumet entrelaçados com fecho gravado à laser com a identidade da marca. Sofisticação discreta no pulso.',
      specifications: 'Material: Aço Cirúrgico 316L | Espessura: 8mm | Comprimento: 19cm e 21cm | Peso: 36g.',
      careInstructions: 'Limpeza periódica com pano seco para manutenção do brilho espelhado.',
      price: 149.90,
      promotionalPrice: 129.90,
      rating: 4.9,
      reviewsCount: 110,
      isNew: false,
      isBestSeller: true,
      isFeatured: true,
      categoryId: catPulseiras.id,
      availableFinishes: JSON.stringify(['silver', 'gold', 'black', 'bicolor']),
      availableSizes: JSON.stringify(['19cm', '21cm']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1611591475879-7153b664d50d?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      name: 'Cordão Baiano Helicoidal 5mm',
      slug: 'cordao-baiano-helicoidal-5mm',
      description: 'Cordão com elos espirais de alta densidade que refletem luminosidade contínua em qualquer ângulo. Pesa agradavelmente no peito.',
      specifications: 'Material: Aço Cirúrgico 316L | Diâmetro: 5mm | Fecho: Garra de Lagosta | Peso: 42g.',
      careInstructions: 'Não amassa, não quebra e mantém a integridade estrutural mecânica.',
      price: 179.90,
      promotionalPrice: 149.90,
      rating: 4.8,
      reviewsCount: 73,
      isNew: true,
      isBestSeller: false,
      isFeatured: true,
      categoryId: catCordoes.id,
      availableFinishes: JSON.stringify(['silver', 'gold']),
      availableSizes: JSON.stringify(['50cm', '60cm']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1611591475870-760f38b2585f?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      name: 'Anel Black Stealth Titanium PVD',
      slug: 'anel-black-stealth-titanium-pvd',
      description: 'Acabamento negro acetinado com ranhura central polida. Revestimento cerâmico de titânio de ultra resistência a atritos.',
      specifications: 'Material: Aço Inoxidável 316L com revestimento Black Titanium PVD | Largura: 8mm | Borda Chanfrada.',
      careInstructions: 'Resistente a riscos e arranhões do cotidiano.',
      price: 119.90,
      promotionalPrice: 89.90,
      rating: 4.9,
      reviewsCount: 135,
      isNew: false,
      isBestSeller: true,
      isFeatured: true,
      categoryId: catAneis.id,
      availableFinishes: JSON.stringify(['black', 'silver']),
      availableSizes: JSON.stringify(['17', '19', '21', '23', '25']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      ]),
    },
  ];

  for (const item of products) {
    await prisma.product.create({
      data: item,
    });
  }

  console.log('--- Seed Concluído com Sucesso: Categorias e Produtos Inox criados! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
