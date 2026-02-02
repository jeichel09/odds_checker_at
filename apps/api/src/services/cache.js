class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
    
    // Clean up expired entries periodically
    if (this.cache.size % 10 === 0) {
      this.cleanup();
    }
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    this.cleanup();
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    this.cleanup();
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(([_, item]) => now > item.expiry).length,
      oldestEntry: entries.length > 0 ? 
        Math.min(...entries.map(([_, item]) => item.expiry - this.defaultTTL)) : null,
      newestEntry: entries.length > 0 ? 
        Math.max(...entries.map(([_, item]) => item.expiry - this.defaultTTL)) : null
    };
  }
}

// Export singleton instance
module.exports = new SimpleCache();