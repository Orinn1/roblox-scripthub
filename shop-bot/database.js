const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUP_FILE = path.join(DATA_DIR, 'database.json.bak');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultData = {
  slips: [],    // { id, hash, refId, rawQr, senderId, channelId, createdAt, status, approvedBy, bankCode, bankName, amount }
  tickets: [],  // { ticketNumber, channelId, userId, createdAt, status, closedAt, closedBy, transcriptSent }
  stats: {
    totalTickets: 0,
    totalSlips: 0,
    approvedSlips: 0
  }
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB Error] Failed to read database, trying backup:', err);
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const backupRaw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        return JSON.parse(backupRaw);
      }
    } catch (bErr) {
      console.error('[DB Error] Failed to read backup database:', bErr);
    }
    return defaultData;
  }
}

function writeDb(data) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    // Atomic write to prevent file corruption
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Save backup copy
    try {
      fs.copyFileSync(DB_FILE, BACKUP_FILE);
    } catch {}
  } catch (err) {
    console.error('[DB Error] Failed to write database:', err);
  }
}

module.exports = {
  // SLIP METHODS
  findSlipByHash(hash) {
    if (!hash) return null;
    const db = readDb();
    return (db.slips || []).find(s => s.hash === hash);
  },

  findSlipByRefId(refId) {
    if (!refId) return null;
    const db = readDb();
    return (db.slips || []).find(s => s.refId && s.refId.toLowerCase() === refId.toLowerCase());
  },

  saveSlip(slipInfo) {
    const db = readDb();
    if (!db.slips) db.slips = [];
    if (!db.stats) db.stats = { totalTickets: 0, totalSlips: 0, approvedSlips: 0 };

    const newSlip = {
      id: `slip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
      approvedBy: null,
      ...slipInfo
    };
    db.slips.push(newSlip);
    db.stats.totalSlips = (db.stats.totalSlips || 0) + 1;
    writeDb(db);
    return newSlip;
  },

  updateSlipStatus(slipId, status, approvedBy = null) {
    const db = readDb();
    const slip = (db.slips || []).find(s => s.id === slipId);
    if (!slip) return null;

    const previousStatus = slip.status;
    if (previousStatus === status) {
      return { ...slip, alreadyUpdated: true };
    }

    slip.status = status;
    slip.approvedBy = approvedBy;
    slip.updatedAt = new Date().toISOString();

    if (!db.stats) db.stats = { totalTickets: 0, totalSlips: 0, approvedSlips: 0 };
    if (status === 'approved' && previousStatus !== 'approved') {
      db.stats.approvedSlips = (db.stats.approvedSlips || 0) + 1;
    } else if (previousStatus === 'approved' && status !== 'approved') {
      db.stats.approvedSlips = Math.max(0, (db.stats.approvedSlips || 0) - 1);
    }

    writeDb(db);
    return slip;
  },

  // TICKET METHODS
  createTicket(channelId, userId) {
    const db = readDb();
    if (!db.tickets) db.tickets = [];
    if (!db.stats) db.stats = { totalTickets: 0, totalSlips: 0, approvedSlips: 0 };

    db.stats.totalTickets = (db.stats.totalTickets || 0) + 1;
    const ticketNumber = String(db.stats.totalTickets).padStart(4, '0');

    const newTicket = {
      ticketNumber,
      channelId,
      userId,
      createdAt: new Date().toISOString(),
      status: 'open',
      closedAt: null,
      closedBy: null,
      transcriptSent: false
    };

    db.tickets.push(newTicket);
    writeDb(db);
    return newTicket;
  },

  getNextTicketNumber() {
    const db = readDb();
    const nextNum = ((db.stats && db.stats.totalTickets) || 0) + 1;
    return String(nextNum).padStart(4, '0');
  },

  getTicketByChannel(channelId) {
    const db = readDb();
    return (db.tickets || []).find(t => t.channelId === channelId);
  },

  findOpenTicketByUser(userId) {
    if (!userId) return null;
    const db = readDb();
    return (db.tickets || []).find(t => t.userId === userId && t.status === 'open');
  },

  closeTicket(channelId, closedBy) {
    const db = readDb();
    const ticket = (db.tickets || []).find(t => t.channelId === channelId);
    if (ticket) {
      ticket.status = 'closed';
      ticket.closedAt = new Date().toISOString();
      ticket.closedBy = closedBy;
      writeDb(db);
      return ticket;
    }
    return null;
  },

  markTranscriptSent(channelId) {
    const db = readDb();
    const ticket = (db.tickets || []).find(t => t.channelId === channelId);
    if (ticket) {
      ticket.transcriptSent = true;
      writeDb(db);
      return ticket;
    }
    return null;
  },

  getStats() {
    const db = readDb();
    return db.stats || { totalTickets: 0, totalSlips: 0, approvedSlips: 0 };
  }
};
