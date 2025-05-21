module 0xb0747bb990f7350bb16863567d0539ad373d51aa6afc951afee7ea6f89a488ec::agarstransferpolicy {
    public fun new_policy<T0>(arg0: &0x2::package::Publisher, arg1: &mut 0x2::tx_context::TxContext) {
        let (v0, v1) = 0x2::transfer_policy::new<T0>(arg0, arg1);
        0x2::transfer::public_share_object<0x2::transfer_policy::TransferPolicy<T0>>(v0);
        0x2::transfer::public_transfer<0x2::transfer_policy::TransferPolicyCap<T0>>(v1, 0x2::tx_context::sender(arg1));
    }
    
    // decompiled from Move bytecode v6
}

