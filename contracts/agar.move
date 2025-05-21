module 0xb0747bb990f7350bb16863567d0539ad373d51aa6afc951afee7ea6f89a488ec::agar {
    struct Agar has store, key {
        id: 0x2::object::UID,
        owner: address,
        author: 0x1::string::String,
        title: 0x1::string::String,
        category: 0x1::string::String,
        story: 0x1::string::String,
    }
    
    struct AgarCreated has copy, drop {
        agar_id: 0x2::object::ID,
        author: address,
    }
    
    public entry fun mint_agar(arg0: vector<u8>, arg1: vector<u8>, arg2: vector<u8>, arg3: vector<u8>, arg4: &mut 0x2::tx_context::TxContext) {
        let v0 = 0x2::tx_context::sender(arg4);
        let v1 = Agar{
            id       : 0x2::object::new(arg4), 
            owner    : v0, 
            author   : 0x1::string::utf8(arg0), 
            title    : 0x1::string::utf8(arg1), 
            category : 0x1::string::utf8(arg2), 
            story    : 0x1::string::utf8(arg3),
        };
        let v2 = AgarCreated{
            agar_id : 0x2::object::id<Agar>(&v1), 
            author  : v0,
        };
        0x2::event::emit<AgarCreated>(v2);
        0x2::transfer::public_transfer<Agar>(v1, v0);
    }
    
    // decompiled from Move bytecode v6
}

