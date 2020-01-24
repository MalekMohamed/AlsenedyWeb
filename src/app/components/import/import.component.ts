import {Component, OnInit} from '@angular/core';
import * as XLSX from 'xlsx';
import {ImportService} from '../../shared/services/firebase/import.service';
import {ItemsService} from '../../shared/services/firebase/items.service';

@Component({
    selector: 'app-import',
    templateUrl: './import.component.html',
    styleUrls: ['./import.component.scss'],
})
export class ImportComponent implements OnInit {
    data: any;
    public show: boolean;
    lang;
    value: any[] = [];

    // wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
    constructor(private importService: ImportService,
                private itemsService: ItemsService) {
        this.lang = localStorage.getItem('lang') === 'ar';
    }

    onFileChange(evt: any) {

        /* wire up file reader */
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) {
            throw new Error('Cannot use multiple files');
        }
        this.show = true;
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            /* read workbook */
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
            /* grab first sheet */
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            /* save data */
            const data = XLSX.utils.sheet_to_json(ws, {header: ['barCodeId', 'code', 'nameArFull', 'materialCode', 'materialNameAr', 'rankingCode', 'rankingNameAr', 'unitCode', 'unitNameAr', 'size']}).slice(1);

            Promise.all([this.importService.importJSON(data)]).then(res => {
                this.show = false;
            });
        };
        reader.readAsBinaryString(target.files[0]);
    }

    ngOnInit() {
        this.lang = localStorage.getItem('lang') === 'ar';
    }

    uploadPriceList(evt: any) {

        /* wire up file reader */
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) {
            throw new Error('Cannot use multiple files');
        }
        this.show = true;
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            /* read workbook */
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
            /* grab first sheet */
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            /* save data */
            let data = XLSX.utils.sheet_to_json(ws, {header: ['no', 'bla1', 'barCodeId', 'bla3', 'bla4', 'bla5', 'code', 'bla7', 'bla8', 'bla9', 'bla10', 'bla11', 'price', 'bla13', 'bla14', 'bla15', 'bla16', 'bla17', 'pricelistCode', 'name', 'bla20', 'bla21', 'bla22', 'bla23', 'bla24', 'bla25', 'qty']}).slice(1);
            this.importService.db.collection('pricelist').doc(data[0]['pricelistCode']).set({
                name: data[0]['name'],
                code: data[0]['pricelistCode']
            }).then(res => {
                data.forEach(rows => {
                    this.importService.importPriceList(rows, data[0]['pricelistCode']);
                });
                this.itemsService.updateItems();
                this.show = false;
            });
        };
        reader.readAsBinaryString(target.files[0]);
    }
    reset() {
        if (confirm('Are you sure about this?\n This will delete all the data you have\n This cannot be undone \nهل تريد مسح كل البيانات؟ \n لا يمكن التراجع عن ذلك')) {
            console.log('Deleting Database')
            this.itemsService.db.collection('item').ref.get().then(res=> {
                res.docs.forEach(doc => {
                    doc.ref.delete();
                })
                console.log('item deleted');
            })
            this.itemsService.db.collection('permission').ref.get().then(res=> {
                res.docs.forEach(doc => {
                    doc.ref.delete();
                })
                console.log('permissions deleted');
            })
            this.itemsService.db.collection('pricelist').ref.get().then(res=> {
                res.docs.forEach(doc => {
                    doc.ref.delete();
                })
                console.log('pricelist deleted');
            })
            this.itemsService.db.collection('carts').ref.get().then(res=> {
                res.docs.forEach(doc => {
                    doc.ref.delete();
                })
                console.log('carts deleted');
            })
            this.itemsService.db.collection('combinations').ref.get().then(res=> {
                res.docs.forEach(doc => {
                    doc.ref.delete();
                })
                console.log('combinations deleted');
            })
        }
    }
    uploadImages() {
        let i = 0;
        this.value.forEach(file => {
            file.newName = Math.floor(Math.random() * 10000000) + '-' + i + '.' + file.name.split('.').reverse()[0];
            let data = {
                barCodeId:file.name.split('.')[0],
            };
            this.itemsService.uploadImage(file, data);
            i++;
        });
    }
}
