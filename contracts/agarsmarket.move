module 0xb0747bb990f7350bb16863567d0539ad373d51aa6afc951afee7ea6f89a488ec::agarsmarket {
    entry fun create_agar_marketplace(arg0: &mut 0x2::tx_context::TxContext) {
        let (v0, v1) = 0x2::kiosk::new(arg0);
        0x2::transfer::public_share_object<0x2::kiosk::Kiosk>(v0);
        0x2::transfer::public_transfer<0x2::kiosk::KioskOwnerCap>(v1, 0x2::tx_context::sender(arg0));
    }
    
    public fun delist_agar<T0: store + key>(arg0: &mut 0x2::kiosk::Kiosk, arg1: &0x2::kiosk::KioskOwnerCap, arg2: 0x2::object::ID) {
        0x2::kiosk::delist<T0>(arg0, arg1, arg2);
    }
    
    public fun list_agar<T0: store + key>(arg0: &mut 0x2::kiosk::Kiosk, arg1: &0x2::kiosk::KioskOwnerCap, arg2: 0x2::object::ID, arg3: u64) {
        0x2::kiosk::list<T0>(arg0, arg1, arg2, arg3);
    }
    
    public fun lock_agar<T0: store + key>(arg0: &mut 0x2::kiosk::Kiosk, arg1: &0x2::kiosk::KioskOwnerCap, arg2: &0x2::transfer_policy::TransferPolicy<T0>, arg3: T0) {
        0x2::kiosk::lock<T0>(arg0, arg1, arg2, arg3);
    }
    
    public fun place_agar<T0: store + key>(arg0: &mut 0x2::kiosk::Kiosk, arg1: &0x2::kiosk::KioskOwnerCap, arg2: T0) {
        0x2::kiosk::place<T0>(arg0, arg1, arg2);
    }
    
    public fun purchase_agar<T0: store + key>(arg0: &mut 0x2::kiosk::Kiosk, arg1: 0x2::object::ID, arg2: 0x2::coin::Coin<0x2::sui::SUI>) : (T0, 0x2::transfer_policy::TransferRequest<T0>) {
        0x2::kiosk::purchase<T0>(arg0, arg1, arg2)
    }
    
    public fun unplace_agar<T0: store + key>(arg0: &mut 0x2::kiosk::Kiosk, arg1: &0x2::kiosk::KioskOwnerCap, arg2: 0x2::object::ID) : T0 {
        0x2::kiosk::take<T0>(arg0, arg1, arg2)
    }
    
    fun verify_kiosk_ownership(arg0: &0x2::kiosk::Kiosk, arg1: &0x2::kiosk::KioskOwnerCap, arg2: address) : bool {
        true
    }
    
    public fun withdraw_profits(arg0: &mut 0x2::kiosk::Kiosk, arg1: &0x2::kiosk::KioskOwnerCap, arg2: 0x1::option::Option<u64>, arg3: &mut 0x2::tx_context::TxContext) : 0x2::coin::Coin<0x2::sui::SUI> {
        0x2::kiosk::withdraw(arg0, arg1, arg2, arg3)
    }
    
    // decompiled from Move bytecode v6
}

