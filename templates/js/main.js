documents_list=[];
image_list=[];
doc_number=0;
err_list=[];
tx=0;
ty=0;
scale = 1;
rotate = 0;
shops_remote = [];
shops_selected = [];
shops_local = [];
mask = 0;
im_params = [];
is_Windowchsh_active = 0;
shops_checked = 0;
shops_count = 0;

Ext.onReady(function(){


    service = new tander.store.JrpcService({
        url: '/json-rpc/',
        methods : [
    //             {
    //                 method: 'get_list_of_images',
    //                 id: "id",
    //                 fields: [
    //                     {images: 'arr_of_paths'},
    //                 ]
    //             },
            "get_list_of_images",
            "logout",
            "get_documents",
            "get_images",
            "push_errors",
            "get_list_of_shops_from_file",
            "push_shops_to_file",
            "get_list_of_shops_from_local_file",
            "create_reg",
            "push_image_params_to_file",
            "get_list_of_shops_from_file2",
            "authorize",
            "isAuthorized",
            ],
            listeners:{
                "jsonexception":{
                    fn: function(obj,resp,error){
                        if(!error){
                            return;
                        }
                        if(error.code == 403){
                           // mainPanel.el.unmask();
                            //mainPanel.disable();
                            //mainTBar.disable();
                            //Ext.WindowMgr.each(function(obj){obj.hide()});
                            loginWindow.show();
                            //authWin.xShowMessage(error.message);
                        }
                        else {
                            Ext.Msg.alert("Ошибка", error.message);
                        }
                    },
                    scope:this
                }
            }
        });
    loginWindow = new tander.AuthWindow({
        listeners : {
            login : function(wnd, user, password) {
                service.authorize(
                    {user : user, password : password},
                    function(o, r, e) {
                        if (r['result'] == true) {
                            wnd.hide()
                            wnd.xClearMessage();
                            if (documents_list.length==0){
                                main(); 
                            }
                            //functions.load_stores();
                        } else {
                            if (r['status'] == 'notfound') {
                                wnd.xShowMessage('Неверные имя или пароль!')
                            } else {
                                wnd.xShowMessage('Отсутствуют права на вход в систему!')
                            }
                        }
                    }
                )
            }
        }
    });

    

    

main = function(){

    //Window choose shops
    var wndchsh = function(){
        var label1 = new Ext.form.Label({
            text:'Выбор магазинов на проверку',
            cls: 'label_bold',
        });
        var label2 = new Ext.form.Label({
            text:'Выбрано: ',
            cls: 'label_usual',
        });

        var store = new Ext.data.Store({
            data: shops_remote, 
            reader: new Ext.data.ArrayReader({id:'id'}, [
                    'Магазин',
                ])
        });
        var myCboxSelModel = new Ext.grid.CheckboxSelectionModel({
            id:'myCboxSelModel',
            width: 30,
          // override private method to allow toggling of selection on or off for multiple rows.
          handleMouseDown : function(g, rowIndex, e){
            var view = this.grid.getView();
            var isSelected = this.isSelected(rowIndex);
            if(isSelected) {
              this.deselectRow(rowIndex);
            } 
            else if(!isSelected || this.getCount() > 1) {
              this.selectRow(rowIndex, true);
              view.focusRow(rowIndex);
            }
          },
          singleSelect: false
        });

            gridDescripionsl = new Ext.grid.GridPanel({
            id:'gridDescripionsl',
            frame:true,
            listeners: {
            'rowclick': function() {
                label2.setText('Выбрано: '+Ext.getCmp('gridDescripionsl').getSelectionModel().getCount());
            },
            },
            //autoScroll:true,
            viewConfig: {
            forceFit: true
                       },
            autoWidth: true,
            //autoHeight: true,
            height:500,
            columns: [
            myCboxSelModel,
            {header: 'Магазин', dataIndex: 'Магазин',},
              ],
            sm: myCboxSelModel,
            store: store
        });

        //Выделяем магазины, которые подгрузили из localfile
        
        var bottom_toolbar = new Ext.Toolbar({
            height: 40,
            frame: true,
            items:[                        
            '->',            
            {
                xtype:'button',
                text:'Отмена',
                handler:function(){
                    Windowchsh.destroy();
                    is_Windowchsh_active=0;
                },
            },
            '-',
            {
                xtype:'button',
                text:'Выбрать',
                handler:function(){
                    var m = Ext.getCmp('gridDescripionsl').getSelectionModel().getSelections();
                    //console.log('m',m)
                    shops_selected=[];
                    for (var i = m.length - 1; i >= 0; i--) {
                        shops_selected[i] = m[i].data["Магазин"];
                    };
                    //console.log('shops_selected',shops_selected)
                    //var shops_selected_json = Ext.encode(shops_selected);
                    localStorage.shops_selected = JSON.stringify(shops_selected);
                    //Ext.util.Cookies.set("local_shops_cookies", '');
                    //Ext.util.Cookies.set("local_shops_cookies", shops_selected_json);
                    //service.push_shops_to_file({shops_selected : shops_selected}, function(result, object, status){
                    //   });

                    //Загрузка док-тов, согласно выбранным магазинам
                    doc_number=0;
                    //service.get_list_of_shops_from_local_file({}, function(result, object, status){
                        //shops_local = object;
                    //shops_local = Ext.decode(Ext.util.Cookies.get('local_shops_cookies'));
                    shops_local = localStorage.shops_selected ? JSON.parse(localStorage.shops_selected) : [];
                    //console.log(shops_local)
                    console.log('1', shops_local);
                    if (shops_local.length<1){
                        mask+=1
                        Ext.getBody().mask('Подождите, загрузка изображения...');
                        service.get_list_of_shops_from_file({}, function(result, object, status){
                            shops_local = object;
                            mask-=1
                            if (mask==0){
                                Ext.getBody().unmask();
                            }
                        });
                    };
                    console.log('2', shops_local);
                    mask+=1
                    Ext.getBody().mask('Подождите, загрузка изображения...');
                    service.get_documents({shops_local : shops_local}, function(result, object, status){
                        documents_list = object;
                        shops_count = documents_list[0].count_all;
                        shops_checked = documents_list[0].count_doc;
                        if (documents_list.length==0){
                            alert('Все документы проверены');
                            Button_next_doc.disable();
                            comp_disable();
                        } else {
                            next_doc();
                        };
                        mask-=1
                        if (mask==0){
                            Ext.getBody().unmask();
                        }
                    });
                    //});
                    
                    Windowchsh.destroy();
                    is_Windowchsh_active=0;
                },
            }],
        });

        

        var my_window = new Ext.Window({
            id: 'Windowchsh',
            title: 'Выбор магазинов',        
            width: 550,
            height:650, 
            plain: true,
            modal : true,
            closable: false,
            layout: 'fit',   
            closeAction: 'destroy',
            listeners: {
            'show': function() {
                
                var f = function(){
                    var m_grid = Ext.getCmp('gridDescripionsl').getStore().data;
                    for (var i = m_grid.length - 1; i >= 0; i--) {
                        for (var j = shops_local.length - 1; j >= 0; j--) {
                            if (m_grid.get(i).data["Магазин"] == shops_local[j]){
                                Ext.getCmp('gridDescripionsl').getSelectionModel().selectRow(i,true)
                            }
                        };
                    };
                    label2.setText('Выбрано: '+Ext.getCmp('gridDescripionsl').getSelectionModel().getCount());
                };
                f();
            },
            'destroy': function(){
                alert('sd');
                is_Windowchsh_active=0;
            } 
            ,delay: 200
            },
            items:[
            label1,
            {xtype: 'displayfield',
            value:'<br/>'},
            label2,
            {xtype: 'displayfield',
            value:'<br/>'},
            gridDescripionsl,
            {xtype: 'displayfield',
            value:'<br/>'},
            bottom_toolbar,
            ],
        });
        return my_window;
    };
   

    //Hot keys
    var mapEnter = new Ext.KeyMap(document,{
        key: 32,
        ctrl: true,
        //scope: Ext.getCmp('image_vp'),
        fn: function(){
            //var element = Ext.getCmp("Button_next_doc");
            //element.fireEvent('click',element); 
            //Ext.getCmp('Button_next_doc').fireEvent('click');
            Ext.getCmp("Button_next_doc").handler.call(Ext.getCmp("Button_next_doc").scope);
            console.log(Ext.getCmp('WRONG_DOC_NUMBER'))
            //clear_checkboxes();

        }
    });
    var map_arrow_right = new Ext.KeyMap(document,{
        key: 39,
        ctrl: true,
        fn: function(){
            if (!Button_image_next.disabled){
                Ext.getCmp("Button_image_next").handler.call(Ext.getCmp("Button_image_next").scope);
            }
        }
    });
    var map_arrow_left = new Ext.KeyMap(document,{
        key: 37,
        ctrl: true,
        fn: function(){
            if (!Button_image_prev.disabled){
                Ext.getCmp("Button_image_prev").handler.call(Ext.getCmp("Button_image_prev").scope);
            }
        }
    });
    var map_inc_s = new Ext.KeyMap(document,{
        key: 187,
        fn: function(){
            if (!Button_image_increase_s.disabled){
                Ext.getCmp("Button_image_increase_s").handler.call(Ext.getCmp("Button_image_increase_s").scope);
            }
        }
    });
    var map_inc_s_2 = new Ext.KeyMap(document,{
        key: 107,
        fn: function(){
            if (!Button_image_increase_s.disabled){
                Ext.getCmp("Button_image_increase_s").handler.call(Ext.getCmp("Button_image_increase_s").scope);
            }
        }
    });
    var map_inc_s_3 = new Ext.KeyMap(document,{
        key: 43,
        fn: function(){
            if (!Button_image_increase_s.disabled){
                Ext.getCmp("Button_image_increase_s").handler.call(Ext.getCmp("Button_image_increase_s").scope);
            }
        }
    });
    var map_inc_s_4 = new Ext.KeyMap(document,{
        key: 61,
        fn: function(){
            if (!Button_image_increase_s.disabled){
                Ext.getCmp("Button_image_increase_s").handler.call(Ext.getCmp("Button_image_increase_s").scope);
            }
        }
    });
    var map_dec_s = new Ext.KeyMap(document,{
        key: 109,
        fn: function(){
            if (!Button_image_decrease_s.disabled){
                Ext.getCmp("Button_image_decrease_s").handler.call(Ext.getCmp("Button_image_decrease_s").scope);
            }
        }
    });
    var map_arrow_top_t = new Ext.KeyMap(document,{
        key: 38,
        fn: function(){
                ty+=50;
                first.transform("t"+tx+','+ty+"r"+rotate+"S"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);
        }
    });
    var map_arrow_bottom_t = new Ext.KeyMap(document,{
        key: 40,
        fn: function(){
                ty-=50;
                first.transform("t"+tx+','+ty+"r"+rotate+"S"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);
        }
    });
     
     var map_arrow_left_t = new Ext.KeyMap(document,{
        key: 39,
        fn: function(){
                tx-=50;
                first.transform("T"+tx+','+ty+"r"+rotate+"S"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);
        }
    });
     var map_arrow_right_t = new Ext.KeyMap(document,{
        key: 37,
        fn: function(){
                tx+=50;
                first.transform("T"+tx+','+ty+"r"+rotate+"S"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);
        }
    });
    var map1 = new Ext.KeyMap(document,{
        key: '1',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('WRONG_DOC_NUMBER').getValue()){
                    Ext.getCmp('WRONG_DOC_NUMBER').setValue(false);
                } else {
                    Ext.getCmp('WRONG_DOC_NUMBER').setValue(true);
                }
            }
        }
    });
    var map2 = new Ext.KeyMap(document,{
        key: '2',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('WRONG_DOC_DATE').getValue()){
                    Ext.getCmp('WRONG_DOC_DATE').setValue(false);
                } else if (!Ext.getCmp('WRONG_DOC_DATE').disabled) {
                    Ext.getCmp('WRONG_DOC_DATE').setValue(true);
                }
            }
        }
    });
    var map3 = new Ext.KeyMap(document,{
        key: '3',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('WRONG_DOC_TYPE').getValue()){
                    Ext.getCmp('WRONG_DOC_TYPE').setValue(false);
                } else if (!Ext.getCmp('WRONG_DOC_TYPE').disabled) {
                    Ext.getCmp('WRONG_DOC_TYPE').setValue(true);
                }
            }
        }
    });
    var map4 = new Ext.KeyMap(document,{
        key: '4',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('WRONG_DOC_CORR_NUM').getValue()){
                    Ext.getCmp('WRONG_DOC_CORR_NUM').setValue(false);
                } else if (!Ext.getCmp('WRONG_DOC_CORR_NUM').disabled) {
                    Ext.getCmp('WRONG_DOC_CORR_NUM').setValue(true);
                }
            }
        }
    });
    var map5 = new Ext.KeyMap(document,{
        key: '5',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('WRONG_DOC_CORR_DATE').getValue()){
                    Ext.getCmp('WRONG_DOC_CORR_DATE').setValue(false);
                } else if (!Ext.getCmp('WRONG_DOC_CORR_DATE').disabled) {
                    Ext.getCmp('WRONG_DOC_CORR_DATE').setValue(true);
                }
            }
        }
    });
    var map6 = new Ext.KeyMap(document,{
        key: '6',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('NO_STAMP').getValue()){
                    Ext.getCmp('NO_STAMP').setValue(false);
                } else if (!Ext.getCmp('NO_STAMP').disabled) {
                    Ext.getCmp('NO_STAMP').setValue(true);
                }
            }
        }
    });
    var map7 = new Ext.KeyMap(document,{
        key: '7',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('BAD_STAMP').getValue()){
                    Ext.getCmp('BAD_STAMP').setValue(false);
                } else if (!Ext.getCmp('BAD_STAMP').disabled) {
                    Ext.getCmp('BAD_STAMP').setValue(true);
                }
            }
        }
    });
    var map8 = new Ext.KeyMap(document,{
        key: '8',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('NO_SIGN').getValue()){
                    Ext.getCmp('NO_SIGN').setValue(false);
                } else {
                    Ext.getCmp('NO_SIGN').setValue(true);
                }
            }
        }
    });
    var map9 = new Ext.KeyMap(document,{
        key: '9',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('BAD_SIGN').getValue()){
                    Ext.getCmp('BAD_SIGN').setValue(false);
                } else {
                    Ext.getCmp('BAD_SIGN').setValue(true);
                }
            }
        }
    });
    var map0 = new Ext.KeyMap(document,{
        key: '0',
        alt: true,
        fn: function(){
            if (!is_Windowchsh_active){
                if (Ext.getCmp('NO_MISTAKES').getValue()){
                    Ext.getCmp('NO_MISTAKES').setValue(false);
                } else if(!(
                                    Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                    Ext.getCmp('WRONG_DOC_DATE').checked||
                                    Ext.getCmp('WRONG_DOC_TYPE').checked||
                                    Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                    Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                    Ext.getCmp('NO_STAMP').checked||
                                    Ext.getCmp('BAD_STAMP').checked||
                                    Ext.getCmp('NO_STAMP').checked||
                                    Ext.getCmp('BAD_SIGN').checked||
                                    Ext.getCmp('NO_SIGN').checked
                                )) {
                    Ext.getCmp('NO_MISTAKES').setValue(true);
                }
            }
        }
    });


    startPath = function () {
        this.ox = 0;
        this.oy = 0;
    },
    movePath = function (dx, dy) {
        var trans_x = dx-this.ox;
        var trans_y = dy-this.oy;
        this.transform("…T"+[trans_x,trans_y]);
        this.ox = dx;
        this.oy = dy;
    },
    upPath = function () {
    };

    paper = Raphael(0, 0, 1, 1);
    first = paper.image(null, 0, 0, 500, 500);

    var push_to_err_list = function(){
        if(Ext.getCmp('WRONG_DOC_NUMBER').getValue()){
                err_list.push(Ext.getCmp('WRONG_DOC_NUMBER').id);
            }
            if(Ext.getCmp('WRONG_DOC_DATE').getValue()){
                err_list.push(Ext.getCmp('WRONG_DOC_DATE').id);
            }
            if(Ext.getCmp('WRONG_DOC_TYPE').getValue()){
                err_list.push(Ext.getCmp('WRONG_DOC_TYPE').id);
            }
            if(Ext.getCmp('WRONG_DOC_CORR_NUM').getValue()){
                err_list.push(Ext.getCmp('WRONG_DOC_CORR_NUM').id);
            }
            if(Ext.getCmp('WRONG_DOC_CORR_DATE').getValue()){
                err_list.push(Ext.getCmp('WRONG_DOC_CORR_DATE').id);
            }
            if(Ext.getCmp('NO_STAMP').getValue()){
                err_list.push(Ext.getCmp('NO_STAMP').id);
            }
            if(Ext.getCmp('BAD_STAMP').getValue()){
                err_list.push(Ext.getCmp('BAD_STAMP').id);
            }
            if(Ext.getCmp('BAD_SIGN').getValue()){
                err_list.push(Ext.getCmp('BAD_SIGN').id);
            }
            if(Ext.getCmp('NO_SIGN').getValue()){
                err_list.push(Ext.getCmp('BAD_SIGN').id);
            }
            if(Ext.getCmp('NO_MISTAKES').getValue()){
                err_list.push(Ext.getCmp('NO_MISTAKES').id);
            }
            if(Ext.getCmp('WRONG_DOC_CONTRACTOR').getValue()){
                err_list.push(Ext.getCmp('WRONG_DOC_CONTRACTOR').id);
            }
            if(Ext.getCmp('WRONG_DOC_SUMM').getValue()){
                err_list.push(Ext.getCmp('WRONG_DOC_SUMM').id);
            }
            
        };
    var clear_checkboxes = function(){    
        Ext.getCmp('WRONG_DOC_NUMBER').setValue(false);
        Ext.getCmp('WRONG_DOC_DATE').setValue(false);
        Ext.getCmp('WRONG_DOC_TYPE').setValue(false);
        Ext.getCmp('WRONG_DOC_CORR_NUM').setValue(false);
        Ext.getCmp('WRONG_DOC_CORR_DATE').setValue(false);
        Ext.getCmp('NO_STAMP').setValue(false);
        Ext.getCmp('BAD_STAMP').setValue(false);
        Ext.getCmp('NO_STAMP').setValue(false);
        Ext.getCmp('BAD_SIGN').setValue(false);
        Ext.getCmp('NO_MISTAKES').setValue(false);
        Ext.getCmp('NO_SIGN').setValue(false);
        Ext.getCmp('WRONG_DOC_CONTRACTOR').setValue(false);
        Ext.getCmp('WRONG_DOC_SUMM').setValue(false);
        err_list=[];
    };

    var next_doc = function(){
        localStorage.im_params = '';
        Ext.getCmp('NO_STAMP').enable();
        Ext.getCmp('BAD_STAMP').enable();
        Ext.getCmp('WRONG_DOC_CORR_NUM').enable();
        Ext.getCmp('WRONG_DOC_CORR_DATE').enable();
        Button_image_prev.disable();
        current_list_index = 0;
        service.get_images({id_document: documents_list[doc_number].id_document}, function(result, object, status){
            image_list = object;
            load_image(0);
            if (current_list_index==(image_list.length-1)){
                Button_image_next.disable();
            } else {Button_image_next.enable();};
        });
        if (documents_list[doc_number].docdate == null){
            documents_list[doc_number].docdate = '___';
        }
        if (documents_list[doc_number].docnumber == null){
            documents_list[doc_number].docnumber = '___';
        }
        var m = documents_list[doc_number].docdate.substring(0, 10).split('-');
        var temp = m[0];
        m[0] = m[2];
        m[2] = temp;
        var date = m.join('.');
        label_doc.setText(documents_list[doc_number].name+' №'+documents_list[doc_number].docnumber+' от '+ date);
        label_checked.setText('Проверено сегодня: '+shops_checked+' из '+shops_count)

        //Логика чек-боксов
        doc_name = documents_list[doc_number].name;
        if(doc_name=="Счет-фактура"){
            Ext.getCmp('NO_STAMP').disable();
            Ext.getCmp('BAD_STAMP').disable();
        }
        if(doc_name!="Счет-фактура"){
            Ext.getCmp('WRONG_DOC_CORR_NUM').disable();
            Ext.getCmp('WRONG_DOC_CORR_DATE').disable();
        }
    }

    var load_image = function(im_number){
        myImg = new Image();
        imgURL = '/static/'+image_list[im_number].placecode+image_list[im_number].placepath+'/'+image_list[im_number].filename; 
        function img_complete(){
            if (myImg.complete || (myImg.height && myImg.height > 0)){
                first = paper.image(imgURL, 0, 0, myImg.width/3, myImg.height/3);
                first.paper.setSize(Ext.get('image_vp').getWidth(), Ext.get('image_vp').getHeight());
                first.drag(movePath, startPath, upPath);
                rotate=0;
                scale=1;
                Ext.getBody().unmask();
            }else{
            Ext.getBody().mask('Подождите, загрузка изображения...');
            setTimeout(img_complete, 500);
            }
        };
        myImg.src = imgURL;
        paper.clear();
        img_complete(); 

        //Загрузга угла поворота изображения из localStore
        im_params = localStorage.im_params ? JSON.parse(localStorage.im_params) : [];
        //Поворот изображения в соответствии с пар-ми из localStore
        for (var i = im_params.length - 1; i >= 0; i--) {
                if (im_params[i][0] == image_list[im_number].id_docfile){
                    rotate = im_params[i][1]
                    first.transform("r"+rotate+"s"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);
                }
            };

        label_page.setText('Страница: '+image_list[im_number].pagenumber+' из '+image_list.length);  
    };

    var comp_disable = function(){
        Ext.getCmp('WRONG_DOC_NUMBER').disable();
        Ext.getCmp('WRONG_DOC_DATE').disable();
        Ext.getCmp('WRONG_DOC_TYPE').disable();
        Ext.getCmp('WRONG_DOC_CORR_NUM').disable();
        Ext.getCmp('WRONG_DOC_CORR_DATE').disable();
        Ext.getCmp('NO_STAMP').disable();
        Ext.getCmp('BAD_STAMP').disable();
        Ext.getCmp('NO_STAMP').disable();
        Ext.getCmp('BAD_SIGN').disable();
        Ext.getCmp('NO_MISTAKES').disable();
        Ext.getCmp('NO_SIGN').disable();
        Ext.getCmp('WRONG_DOC_CONTRACTOR').disable();
        Ext.getCmp('WRONG_DOC_SUMM').disable();
        Button_image_prev.disable();
        Button_image_next.disable();
        Button_image_rotate_r.disable();
        Button_image_rotate_l.disable();
        Button_image_increase_s.disable();
        Button_image_decrease_s.disable();
    }

    var Button_next_doc = new Ext.Button({
        text: 'Следующий документ >>',
        id:'Button_next_doc',
        handler: function(){ 
            push_to_err_list();
            if (err_list.length>0){

                if (doc_number < documents_list.length-1){
                    doc_number+=1;
                    next_doc();
                    if (documents_list[doc_number].num == null){
                        documents_list[doc_number].num = '___';
                        };
                        if (documents_list[doc_number].vvdate == null){
                            documents_list[doc_number].vvdate = '___';
                        };
                        label_cor1.setText('№ испр.: '+documents_list[doc_number].num);
                        label_cor2.setText('Дата испр.: '+documents_list[doc_number].vvdate.substring(0, 10));
                } else {
                    first.hide();
                    label_page.setText('');
                    label_cor1.setText('');
                    label_cor2.setText('');
                    label_doc.setText('');
                    Button_image_prev.disable();
                    Button_image_next.disable();
                    Button_image_rotate_r.disable();
                    Button_image_rotate_l.disable();
                    Button_image_increase_s.disable();
                    Button_image_decrease_s.disable();
                    alert('Все документы проверены!');
                    comp_disable();
                };  
                if (doc_number<documents_list.length){
                    //push_to_err_list();
                    Ext.getBody().mask('Подождите, обновление данных...');
                    if (doc_number-1 == -1){
                        doc_number +=1;
                    }
                    service.push_errors({id_document: documents_list[doc_number-1].id_document, err_list: err_list}, function(result, object, status){
                                Ext.getBody().unmask();
                                clear_checkboxes();
                        });

                    //Счетчик проверенных документов
                    shops_checked+=1;
                    label_checked.setText('Проверено сегодня: '+shops_checked+' из '+shops_count);
                }
                //doc_number+=1;
            } else {
                if (doc_number < documents_list.length){
                    alert('Не указано ни одной ошибки. Укажите ошибки, либо их отсутствие.');
                }
                else {
                    alert('Все документы проверены!');
                    comp_disable();
                }
            }
        },
    });

    var Button_image_next = new Ext.Button({
        id:'Button_image_next',
        icon:'/static/icons/b_next16.png',
        handler: function(){
            if (current_list_index<(image_list.length-1)){
                current_list_index+=1;
            };
            if (current_list_index==(image_list.length-1)){
                Button_image_next.disable();
            }
            //Запись в файл угла поворота изображения
            Button_image_prev.enable();
            load_image(current_list_index);
    },
    });

    var Button_image_prev = new Ext.Button({
        icon:'/static/icons/b_prev16.png',
        id:'Button_image_prev',
        split: true,
        handler: function(){
            if (current_list_index>0){
                current_list_index-=1;
            };
            if (current_list_index==0){
                Button_image_prev.disable();
            };
            Button_image_next.enable();
            load_image(current_list_index);
    },
    });

    var Button_image_rotate_r = new Ext.Button({
        icon:'/static/icons/b_r_r_16.png',
        handler: function(){
            rotate += 90;
            first.transform("r"+rotate+"s"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);

            // Сохранение в LocalStorage угла поворота изображения
            var temp = []
            temp[0] = image_list[current_list_index].id_docfile;
            temp[1] = rotate;
            var is_im_wr = 1
            for (var i = im_params.length - 1; i >= 0; i--) {
                if (im_params[i][0] == image_list[current_list_index].id_docfile){
                    im_params[i][1] = rotate;
                    is_im_wr=0;
                }
            };
            if (is_im_wr){
                im_params[im_params.length] = temp;
            }
            localStorage.im_params = JSON.stringify(im_params);
    },
    });

        var Button_image_rotate_l = new Ext.Button({
        icon:'/static/icons/b_r_l_16.png',
        handler: function(){
            rotate -= 90;
            first.transform("r"+rotate+"s"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);

            // Сохранение в LocalStorage угла поворота изображения
            var temp = []
            temp[0] = image_list[current_list_index].id_docfile;
            temp[1] = rotate;
            var is_im_wr = 1
            for (var i = im_params.length - 1; i >= 0; i--) {
                if (im_params[i][0] == image_list[current_list_index].id_docfile){
                    im_params[i][1] = rotate;
                    is_im_wr=0;
                }
            };
            if (is_im_wr){
                im_params[im_params.length] = temp;
            }
            localStorage.im_params = JSON.stringify(im_params);
    },
    });

        var Button_image_increase_s = new Ext.Button({
            id:'Button_image_increase_s',
            icon:'/static/icons/b_inc_16.png',
            handler: function(){
                scale = scale*1.3;
                first.transform("T"+0+','+0+"R"+rotate+"S"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);
    },
    }); 

        var Button_image_decrease_s = new Ext.Button({
            id:'Button_image_decrease_s',
            icon:'/static/icons/b_desc_16.png',
            handler: function(){
                scale = scale*0.7;
                first.transform("r"+rotate+"s"+scale+","+scale+"," +Ext.get('image_vp').getWidth()/2+","+ Ext.get('image_vp').getHeight()/2);

    },
    });    

    var Button_logout = new Ext.Button({
        text:'Выход',
        id:'Button_logout',
        split: true,
        handler: function(){
            service.logout({}, function(result, object, status){
                    });
            loginWindow.show();
    },
    }); 

    var Button_choose_shops = new Ext.Button({
        id:'Button_choose_shops',
        text:'Выбрать магазины',
        handler: function(){

            Ext.getBody().mask('Подождите, обновление данных...');
            service.get_list_of_shops_from_file2({}, function(result, object, status){
                //service.get_list_of_shops_from_local_file({}, function(result, object, status){
                    //shops_local = object;
                //});
                shops_remote = object;
                //shops_local = Ext.decode(Ext.util.Cookies.get('local_shops_cookies'));
                shops_local = localStorage.shops_selected ? JSON.parse(localStorage.shops_selected) : [];
                if (shops_local.length<1){
                    service.get_list_of_shops_from_file({}, function(result, object, status){
                        shops_local = object;
                    });
                };
                
                Windowchsh = wndchsh();
                Windowchsh.show();
                is_Windowchsh_active=1;
                Windowchsh.on('show', function() {
                    alert('yyy');
                }, this);

                Ext.getBody().unmask();
  
            });
           
            
            
        },
    });

    

    var label_doc = new Ext.form.Label({
            id:'label_doc',
            text:'',
            cls: 'label_bold',
            flex:1,
        });
    var label_checked = new Ext.form.Label({
            id:'label_checked',
            text:'',
            cls: 'label_bold',
            flex:1,
        });
    var label_page = new Ext.form.Label({
            id:'label_page',
            text:'Страница:',
            cls: 'label_bold',
            flex:2,
        });
    var label_cor1 = new Ext.form.Label({
            text:'№ испр.:___',
            cls: 'label_bold',
            flex:4,
        });
    var label_cor2 = new Ext.form.Label({
            text:'Дата испр.:___:',
            cls: 'label_bold',
            flex:4,
        });
/*    var label_pages = new Ext.form.Label({
            text:'Страницы:',
            cls: 'label_bold',
            flex:5,
        });*/
    /*var label_selected_in_shop = new Ext.form.Label({
            text:'Отмечено на магазине:',
            cls: 'label_bold',
            flex:5,
        });*/
    var label_marks = new Ext.form.Label({
            text:'Отметки:',
            cls: 'label_bold',
            flex:5,
        });
    var textarea_main = new Ext.form.TextArea({
            value: 'отметка1',
            width: '100%',
            height:100,
            });
    var doc_panel = new Ext.Panel({
        layout:'form',
        frame:true,
        items:[Button_logout,
        Button_next_doc,
        {xtype: 'displayfield', value:'<br/>'},
        label_checked,
        {xtype: 'displayfield', value:'<br/>'},
        Button_choose_shops,
        {xtype: 'displayfield', value:'<br/>'},
        label_doc,
        {xtype: 'displayfield', value:'<br/>'},
        label_cor1,
        {xtype: 'displayfield', value:'<br/>'},
        label_cor2,
        {xtype: 'displayfield', value:'<br/>'},
        /*label_page,
        {xtype: 'displayfield', value:'<br/>'},*/
        ],
    });
    var image_panel_page = new Ext.Panel({
        layout:'hbox',
        frame:true,
        items:[label_page,Button_image_prev,Button_image_next],
    });
    var image_panel_r_s = new Ext.Panel({
        layout:'hbox',
        frame:true,
        items:[Button_image_rotate_l,
        {xtype:'spacer',flex:1},
        Button_image_rotate_r,
        {xtype:'spacer',flex:2},
        {xtype:'spacer',flex:2},
        Button_image_increase_s,
        {xtype:'spacer',flex:1},
        Button_image_decrease_s,
        ],
    });
    /*var panel_shop = new Ext.Panel({
        layout:'fit',
        frame:true,
        items:[label_selected_in_shop,textarea_main,
        ],
    });*/

    

    var marks_panel = new Ext.Panel({
        layout:'form',
        frame:true,
        items:[label_marks,
        {xtype:'checkbox',
            id:'WRONG_DOC_NUMBER',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Неверный номер документа',
            fieldLabel: 'Неверный номер документа',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype:'checkbox',
            id:'WRONG_DOC_DATE',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Неверная дата документа',
            fieldLabel: 'Неверная дата документа',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        //{xtype: 'displayfield', value:'<br/>'},

        {xtype:'checkbox',
            id:'WRONG_DOC_SUMM',
            name:"WRONG_DOC_SUMM",
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Неверная сумма документа',
            fieldLabel: 'Неверная сумма документа',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },

        //{xtype: 'displayfield', value:'<br/>'},

        {xtype:'checkbox',
            id:'WRONG_DOC_CONTRACTOR',
            name:"WRONG_DOC_CONTRACTOR",
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Неверный контрагент документа',
            fieldLabel: 'Неверный контрагент документа',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype:'checkbox',
            id:'WRONG_DOC_TYPE',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Неверный тип документа',
            fieldLabel: 'Неверный тип документа',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                        if(doc_name=="Счет-фактура"){
                            Ext.getCmp('NO_STAMP').enable();
                            Ext.getCmp('BAD_STAMP').enable();
                        };
                        if(doc_name!="Счет-фактура"){
                            Ext.getCmp('WRONG_DOC_CORR_NUM').enable();
                            Ext.getCmp('WRONG_DOC_CORR_DATE').enable();
                        };
                    };
                    if (!checked){
                        if(doc_name=="Счет-фактура"){
                            Ext.getCmp('NO_STAMP').disable();
                            Ext.getCmp('BAD_STAMP').disable();
                        }
                        if(doc_name!="Счет-фактура"){
                            Ext.getCmp('WRONG_DOC_CORR_NUM').disable();
                            Ext.getCmp('WRONG_DOC_CORR_DATE').disable();
                        }
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype: 'displayfield', value:'<br/>'},
        {xtype:'checkbox',
            id:'WRONG_DOC_CORR_NUM',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Неверный номер исправления',
            fieldLabel: 'Неверный номер исправления',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype:'checkbox',
            id:'WRONG_DOC_CORR_DATE',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Неверная дата исправления',
            fieldLabel: 'Неверная дата исправления',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype:'checkbox',
            id:'NO_STAMP',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Отсутствует печать',
            fieldLabel: 'Отсутствует печать',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype:'checkbox',
            id:'BAD_STAMP',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Печать расположена неверно',
            fieldLabel: 'Печать расположена неверно',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype:'checkbox',
            id:'NO_SIGN',
            name:"NO_SIGN",
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Отсутствует подпись',
            fieldLabel: 'Отсутствует подпись',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                }
            }
        },
        {xtype:'checkbox',
            id:'BAD_SIGN',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Подпись расположена неверно',
            fieldLabel: 'Подпись расположена неверно',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('NO_MISTAKES').setValue(false);
                        Ext.getCmp('NO_MISTAKES').disable();
                    };
                    if (!checked){
                        if (!(
                                Ext.getCmp('WRONG_DOC_NUMBER').checked||
                                Ext.getCmp('WRONG_DOC_DATE').checked||
                                Ext.getCmp('WRONG_DOC_TYPE').checked||
                                Ext.getCmp('WRONG_DOC_CORR_NUM').checked||
                                Ext.getCmp('WRONG_DOC_CORR_DATE').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_STAMP').checked||
                                Ext.getCmp('NO_STAMP').checked||
                                Ext.getCmp('BAD_SIGN').checked||
                                Ext.getCmp('NO_SIGN').checked||
                                Ext.getCmp('WRONG_DOC_CONTRACTOR').checked||
                                Ext.getCmp('WRONG_DOC_SUMM').checked
                            ))
                            {
                                Ext.getCmp('NO_MISTAKES').enable();
                            }
                    }
                },
            }
        },

        {xtype: 'displayfield', value:'<br/>'},

        {xtype:'checkbox',
            id:'NO_MISTAKES',
            labelSeparator: '',
            hideLabel: true,
            boxLabel: 'Ошибок нет',
            fieldLabel: 'Ошибок нет',
            listeners: {
                check: function(cb, checked){
                    if (checked){
                        Ext.getCmp('WRONG_DOC_NUMBER').setValue(false);
                        Ext.getCmp('WRONG_DOC_DATE').setValue(false);
                        Ext.getCmp('WRONG_DOC_TYPE').setValue(false);
                        Ext.getCmp('WRONG_DOC_CORR_NUM').setValue(false);
                        Ext.getCmp('WRONG_DOC_CORR_DATE').setValue(false);
                        Ext.getCmp('NO_STAMP').setValue(false);
                        Ext.getCmp('BAD_STAMP').setValue(false);
                        Ext.getCmp('NO_SIGN').setValue(false);
                        Ext.getCmp('BAD_SIGN').setValue(false);
                        Ext.getCmp('WRONG_DOC_SUMM').setValue(false);
                        Ext.getCmp('WRONG_DOC_CONTRACTOR').setValue(false);

                    }
                }
            }
        },

        

        ],
    });
    var main_panel = new Ext.Panel({
        layout:'form',
        frame:true,
        autoScroll:true,
        width:200,
        items:[
        doc_panel,
        image_panel_page,
        image_panel_r_s,
        //panel_shop,
        {tag:'br'},
        {tag:'hr'},
        marks_panel,
        ]
    });


    var viewport = new Ext.Viewport({
    layout: 'border',
    renderTo: Ext.getBody(),
    items: [
    {
        region: 'center',
        //xtype: 'panel',
        id:'image_vp',
        items:[paper],
        //layout:'fit',
        autoScroll:true,
        //html: 'Center',
        listeners: {
                        afterlayout: function(){
                             first.paper.setSize(Ext.get('image_vp').getWidth(), Ext.get('image_vp').getHeight());
                        }
                    },
    },
    {
        region: 'east',
        xtype: 'form',
        split:true,
        width:200,
        layout:'fit',
        items:[main_panel],
        //html: 'East'
    },]
    });

    mask+=1
    Ext.getBody().mask('Подождите, загрузка изображения...');
    service.create_reg({}, function(result, object, status){
        mask-=1
        if (mask==0){
            Ext.getBody().unmask();
        }
    });

    //shops_local = Ext.decode(Ext.util.Cookies.get('local_shops_cookies'));
    shops_local = localStorage.shops_selected ? JSON.parse(localStorage.shops_selected) : [];
    //console.log(shops_local)
    Ext.getBody().mask('Подождите, загрузка изображения...');
    mask+=1
    service.get_list_of_images({}, function(result, object, status){
        images_list = object;
        mask-=1
        if (mask==0){
            Ext.getBody().unmask();
        }
    });


    //service.get_list_of_shops_from_local_file({}, function(result, object, status){
    //shops_local = object;
    //console.log('shops_local.length',shops_local.length);_
    if (shops_local.length<1){
        console.log(shops_local.length)
        service.get_list_of_shops_from_file({}, function(result, object, status){
            shops_local = object;
     
            console.log('shops_local.length',shops_local.length);
            Ext.getBody().mask('Подождите, загрузка изображения...');
            mask+=1
            service.get_documents({shops_local : shops_local}, function(result, object, status){
                documents_list = object;
                shops_count = documents_list[0].count_all;
                shops_checked = documents_list[0].count_doc;
                if (documents_list.length==0){
                    alert('Все документы проверены');
                    Button_next_doc.disable();
                    comp_disable();
                } else {
                    next_doc();
                };
                mask-=1
                if (mask==0){
                    Ext.getBody().unmask();
                }
            });
        });
    } else {
        Ext.getBody().mask('Подождите, загрузка изображения...');
        mask+=1
        service.get_documents({shops_local : shops_local}, function(result, object, status){
            documents_list = object;
            shops_count = documents_list[0].count_all;
            shops_checked = documents_list[0].count_doc;
            if (documents_list.length==0){
                alert('Все документы проверены');
                Button_next_doc.disable();
                comp_disable();
            } else {
                next_doc();
            };
            mask-=1
            if (mask==0){
                Ext.getBody().unmask();
            }
        });
    }
}
    
    //});

service.isAuthorized({}, function(o, r, e) {
        if (r !== true){
            loginWindow.show();
        }else{
    

               main(); 




        }
    });
    

    

});



