/// 定义 Agar 模块，包含 Agar 对象的结构和铸造逻辑。
module 0xb0747bb990f7350bb16863567d0539ad373d51aa6afc951afee7ea6f89a488ec::agar {

    /// 定义 Agar 结构体，代表一个 Agar 数字资产。
    /// 具有 store 能力，表示可以存储在链上。
    /// 具有 key 能力，表示可以作为全局对象的键，通常用于拥有对象。
    struct Agar has store, key {
        /// 对象的唯一标识符。
        id: 0x2::object::UID,
        /// 当前拥有该对象的地址。
        owner: address,
        /// Agar 的作者信息。
        author: 0x1::string::String,
        /// Agar 的标题。
        title: 0x1::string::String,
        /// Agar 的分类。
        category: 0x1::string::String,
        /// Agar 的故事或主要内容。
        story: 0x1::string::String,
    }

    /// 定义 AgarCreated 事件结构体。
    /// 具有 copy 和 drop 能力，通常用于事件。
    /// 在 Agar 对象被成功创建时发出。
    struct AgarCreated has copy, drop {
        /// 新创建的 Agar 对象的 ID。
        agar_id: 0x2::object::ID,
        /// 创建 Agar 对象的作者地址。
        author: address,
    }

    /// 公共入口函数，用于铸造（创建）一个新的 Agar 对象。
    /// 任何人都可以调用此函数来创建 Agar。
    /// arg0: 作者信息的字节向量。
    /// arg1: 标题信息的字节向量。
    /// arg2: 分类信息的字节向量。
    /// arg3: 故事内容的字节向量。
    /// arg4: 交易上下文，用于获取发送者和创建新的 UID。
    public entry fun mint_agar(arg0: vector<u8>, arg1: vector<u8>, arg2: vector<u8>, arg3: vector<u8>, arg4: &mut 0x2::tx_context::TxContext) {
        /// 获取当前交易的发送者地址。
        let v0 = 0x2::tx_context::sender(arg4);
        /// 创建一个新的 Agar 对象实例。
        let v1 = Agar{
            /// 为新对象生成一个唯一的 UID。
            id       : 0x2::object::new(arg4),
            /// 将发送者设置为对象的初始拥有者。
            owner    : v0,
            /// 将输入的字节向量转换为 UTF8 字符串作为作者。
            author   : 0x1::string::utf8(arg0),
            /// 将输入的字节向量转换为 UTF8 字符串作为标题。
            title    : 0x1::string::utf8(arg1),
            /// 将输入的字节向量转换为 UTF8 字符串作为分类。
            category : 0x1::string::utf8(arg2),
            /// 将输入的字节向量转换为 UTF8 字符串作为故事内容。
            story    : 0x1::string::utf8(arg3),
        };
        /// 创建一个 AgarCreated 事件实例。
        let v2 = AgarCreated{
            /// 获取新创建的 Agar 对象的 ID。
            agar_id : 0x2::object::id<Agar>(&v1),
            /// 记录作者地址。
            author  : v0,
        };
        /// 发出 AgarCreated 事件。
        0x2::event::emit<AgarCreated>(v2);
        /// 将新创建的 Agar 对象公开转移给发送者。
        0x2::transfer::public_transfer<Agar>(v1, v0);
    }

    // decompiled from Move bytecode v6
}

