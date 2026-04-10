/**
 * JuleMarket v1.1 (Hardened)
 * - Anti-Gaming Layer
 * - Dynamic Pricing
 * - Liquidity Support
 */

export class JuleMarket {

  async listSeed(seed: juleSeed, priceInJule: number, sellerId: string): Promise<Listing> {

    const audit = await shredder.executeAuditForSeed(seed);
    if (audit.status === 'BURN') {
      throw new Error('Low-value seed.');
    }

    // ── Ownership check
    if (seed.creatorId !== sellerId) {
      throw new Error('Ownership mismatch.');
    }

    // ── Anti-Gaming: 類似Seed出品制限（Φチェック）
    const similar = await storage.findSimilarSeeds(seed.fingerprint, 0.92);
    if (similar.length > 3) {
      throw new Error('Market spam detected: Similar seeds overflow.');
    }

    // ── Quality Score
    const qualityScore =
      audit.jule *
      audit.fingerprint.sigma *
      (1 - audit.fingerprint.phi);

    // ── Dynamic floor price（市場連動）
    const marketAvg = await storage.getMarketAverage();
    const minPrice = Math.max(
      qualityScore * 0.5,
      marketAvg * 0.3
    );

    if (priceInJule < minPrice) {
      throw new Error(`Price too low. Min: ${minPrice.toFixed(2)}`);
    }

    const listing: Listing = {
      listingId: generateId(),
      seed,
      sellerId,
      price: priceInJule,
      status: "ACTIVE",
      state: {
        baseValue: audit.jule,
        createdAt: Date.now(),
        usageCount: 0,
        entropyLeak: 0,
        evolutionFactor: seed.evolution_factor || 1.0
      },
      metadata: {
        qualityScore,
        sigma: audit.fingerprint.sigma,
        phi: audit.fingerprint.phi,
        deltaH: audit.fingerprint.deltaHPrime
      }
    };

    await storage.saveListing(listing);
    return listing;
  }

  async buy(listingId: string, buyerId: string) {

    const listing = await storage.getListing(listingId);
    if (!listing || listing.status !== "ACTIVE") {
      throw new Error('Unavailable.');
    }

    // ── Anti-Self Trade
    if (listing.sellerId === buyerId) {
      throw new Error('Self-trading prohibited.');
    }

    // ── Sybil Attack対策（Φベース）
    const similarity = await storage.checkUserSimilarity(
      listing.sellerId,
      buyerId
    );
    if (similarity > 0.9) {
      throw new Error('Sybil attack detected.');
    }

    const effectiveValue = this.computeEffectiveValue(listing);

    if (effectiveValue < listing.price * 0.4) {
      throw new Error('Overpriced degraded seed.');
    }

    // ── Dynamic Fee（ネットワーク負荷依存）
    const networkLoad = await storage.getNetworkLoad();
    const feeRate = 0.03 + (networkLoad * 0.07); // 3%〜10%

    const fee = listing.price * feeRate;

    await treasury.transfer(buyerId, listing.sellerId, listing.price - fee);
    await treasury.transfer(buyerId, "TREASURY", fee);

    // ── Hydrate権限（動的）
    const maxUses = Math.max(1, Math.floor(3 * listing.state.evolutionFactor));

    await storage.grantHydratePermission(buyerId, listing.seed, {
      maxUses,
      decay: 0.7
    });

    // ── Reputation update（非対称強化）
    await reputationSystem.update(listing.sellerId, 0.01);
    await reputationSystem.update(buyerId, 0.003);

    listing.state.usageCount++;

    // ── 自動アーカイブ条件
    if (listing.state.usageCount > 12 || effectiveValue < 5) {
      listing.status = "ARCHIVED";
    }

    await storage.saveListing(listing);

    return { success: true, effectiveValue };
  }

  private computeEffectiveValue(listing: Listing): number {

    const { baseValue, createdAt, usageCount, entropyLeak, evolutionFactor } = listing.state;

    const age = (Date.now() - createdAt) / (1000 * 60 * 60);

    // ── 進化耐性
    const resistance = Math.log1p(evolutionFactor);

    const decayConst = 72 * (1 + resistance);
    const freshness = Math.exp(-age / decayConst);

    // ── 希少性
    const scarcity = 1 / (1 + usageCount * 0.25);

    // ── 情報純度
    const integrity = Math.exp(-entropyLeak);

    // ── 市場ブースト（人気補正）
    const demandBoost = Math.log1p(usageCount);

    return baseValue * freshness * scarcity * integrity * (1 + demandBoost * 0.1);
  }

  async updateAfterHydrate(listingId: string, auditResult: any) {

    const listing = await storage.getListing(listingId);
    if (!listing) return;

    // ── Entropy Leak（劣化）
    const leak = Math.max(0, 0.3 - auditResult.deltaHPrime);
    listing.state.entropyLeak += leak;

    // ── Evolution（成長）
    if (auditResult.jule > 80) {
      listing.state.evolutionFactor *= 1.08;
    }

    // ── 崩壊条件（低品質連鎖）
    if (listing.state.entropyLeak > 2.5) {
      listing.status = "DECAYED";
    }

    await storage.saveListing(listing);
  }
}
