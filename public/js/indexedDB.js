/**
 * FileStorageManager
 * IndexedDB を使って File オブジェクトを管理するクラス
 * 
 * 
 */
class FileStorageManager {
  /**
   * @param {string} dbName    - データベース名
   * @param {string} storeName - オブジェクトストア名
   * @param {number} version   - DBバージョン
   */
  constructor(dbName = "FileStorage", storeName = "files", version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.db = null;
  }

  // -------------------------------------------------------
  // 接続
  // -------------------------------------------------------

  /**
   * DBを開く（未接続なら接続してから返す）
   * @returns {Promise<IDBDatabase>}
   */
  open() {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // keyPath: "id" を自動採番（autoIncrement）で作成
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
          // ファイル名・MIMEタイプ・保存日時でインデックスを張る
          store.createIndex("name", "name", { unique: false });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("savedAt", "savedAt", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(new Error(`DB open failed: ${event.target.error}`));
      };
    });
  }

  /**
   * DBを閉じる
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // -------------------------------------------------------
  // 内部ヘルパー
  // -------------------------------------------------------

  /** トランザクションとストアを取得 */
  _getStore(mode = "readonly") {
    const tx = this.db.transaction(this.storeName, mode);
    return { tx, store: tx.objectStore(this.storeName) };
  }

  /** IDBRequest を Promise でラップ */
  _promisify(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(request.error));
    });
  }

  // -------------------------------------------------------
  // CRUD
  // -------------------------------------------------------

  /**
   * Fileを保存する
   * @param {File} file
   * @returns {Promise<number>} 採番されたID
   */
  async save(file) {
    if (!(file instanceof File)) throw new TypeError("file must be a File object");
    await this.open();

    const record = {
      // File の中身は Blob として保存可能
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      savedAt: Date.now(),
    };

    const { store } = this._getStore("readwrite");
    const id = await this._promisify(store.add(record));
    return id;
  }

  /**
   * 複数Fileをまとめて保存
   * @param {File[]} files
   * @returns {Promise<number[]>} IDの配列
   */
  async saveAll(files) {
    return Promise.all(files.map((f) => this.save(f)));
  }

  /**
   * IDでレコードを取得
   * @param {number} id
   * @returns {Promise<{id, file, name, type, size, lastModified, savedAt} | undefined>}
   */
  async get(id) {
    await this.open();
    const { store } = this._getStore();
    return this._promisify(store.get(id));
  }

  /**
   * IDでFileオブジェクトのみを取得
   * @param {number} id
   * @returns {Promise<File | undefined>}
   */
  async getFile(id) {
    const record = await this.get(id);
    return record?.file;
  }

  /**
   * 全レコードを取得
   * @returns {Promise<Array>}
   */
  async getAll() {
    await this.open();
    const { store } = this._getStore();
    return this._promisify(store.getAll());
  }

  /**
   * ファイル名で検索（前方一致ではなく完全一致）
   * @param {string} name
   * @returns {Promise<Array>}
   */
  async findByName(name) {
    await this.open();
    const { store } = this._getStore();
    const index = store.index("name");
    return this._promisify(index.getAll(name));
  }

  /**
   * MIMEタイプで検索
   * @param {string} type - 例: "image/png"
   * @returns {Promise<Array>}
   */
  async findByType(type) {
    await this.open();
    const { store } = this._getStore();
    const index = store.index("type");
    return this._promisify(index.getAll(type));
  }

  /**
   * レコードを更新（Fileを差し替える）
   * @param {number} id
   * @param {File} newFile
   * @returns {Promise<number>} 同じID
   */
  async update(id, newFile) {
    if (!(newFile instanceof File)) throw new TypeError("newFile must be a File object");
    await this.open();

    const existing = await this.get(id);
    if (!existing) throw new Error(`Record not found: id=${id}`);

    const record = {
      ...existing,
      file: newFile,
      name: newFile.name,
      type: newFile.type,
      size: newFile.size,
      lastModified: newFile.lastModified,
      updatedAt: Date.now(),
    };

    const { store } = this._getStore("readwrite");
    return this._promisify(store.put(record));
  }

  /**
   * IDでレコードを削除
   * @param {number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.open();
    const { store } = this._getStore("readwrite");
    return this._promisify(store.delete(id));
  }

  /**
   * 全レコードを削除
   * @returns {Promise<void>}
   */
  async clear() {
    await this.open();
    const { store } = this._getStore("readwrite");
    return this._promisify(store.clear());
  }

  /**
   * DB自体を削除する（静的メソッド）
   * @param {string} dbName
   * @returns {Promise<void>}
   */
  static deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(req.error));
    });
  }
}

// -------------------------------------------------------
// 使用例
// -------------------------------------------------------
const manager = new FileStorageManager();
/*
// <input type="file"> の change イベント等から
const file = new File(["hello world"], "hello.txt", { type: "text/plain" });

// 保存
const id = await manager.save(file);
console.log("saved id:", id);   // => 1

// 取得
const record = await manager.get(id);
console.log(record);       // => "hello.txt"

// Fileだけ取得してObjectURLを作る
const f = await manager.getFile(id);
const url = URL.createObjectURL(f);

// 全件取得
const all = await manager.getAll();

// 名前で検索
const found = await manager.findByName("hello.txt");

// 更新
const newFile = new File(["updated!"], "hello.txt", { type: "text/plain" });
await manager.update(id, newFile);

// 削除
await manager.delete(id);

// DB閉じる
manager.close();
*/
export default FileStorageManager;