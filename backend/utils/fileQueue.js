const fs = require("fs");
const path = require("path");

const PERSIST_FILE = path.join(__dirname, "..", "pending_results.json");

class FileQueue {
  constructor() {
    this.pending = [];
    this.loadPending();
  }

  // Load pending items from file
  loadPending() {
    try {
      if (fs.existsSync(PERSIST_FILE)) {
        const data = fs.readFileSync(PERSIST_FILE, "utf8");
        this.pending = JSON.parse(data) || [];
        console.log(
          `📁 Loaded ${this.pending.length} pending items from queue`
        );
      }
    } catch (err) {
      console.error("Error loading pending queue:", err);
      this.pending = [];
    }
  }

  // Save pending items to file
  persistPending() {
    try {
      fs.writeFileSync(PERSIST_FILE, JSON.stringify(this.pending, null, 2));
    } catch (err) {
      console.error("Error persisting queue:", err);
    }
  }

  // Add item to queue
  enqueue(item) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      data: item,
      retries: 0,
    };

    this.pending.push(queueItem);
    this.persistPending();
    console.log(`📝 Queued item: ${queueItem.id}`);

    return queueItem.id;
  }

  // Remove item from queue
  dequeue(id) {
    const index = this.pending.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.pending.splice(index, 1);
      this.persistPending();
      console.log(`✅ Dequeued item: ${id}`);
      return true;
    }
    return false;
  }

  // Get all pending items
  getPending() {
    return [...this.pending];
  }

  // Increment retry count
  incrementRetry(id) {
    const item = this.pending.find((item) => item.id === id);
    if (item) {
      item.retries += 1;
      item.lastRetry = new Date().toISOString();
      this.persistPending();
      return item.retries;
    }
    return 0;
  }

  // Clear all pending items
  clear() {
    this.pending = [];
    this.persistPending();
    console.log("🗑️  Cleared all pending items");
  }

  // Get queue statistics
  getStats() {
    return {
      total: this.pending.length,
      oldestTimestamp:
        this.pending.length > 0 ? this.pending[0].timestamp : null,
      newestTimestamp:
        this.pending.length > 0
          ? this.pending[this.pending.length - 1].timestamp
          : null,
    };
  }
}

// Singleton instance
const fileQueue = new FileQueue();

module.exports = fileQueue;
