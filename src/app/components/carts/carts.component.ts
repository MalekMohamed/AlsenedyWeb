import {Component, OnInit, Output} from '@angular/core';
import {CartsService} from '../../shared/services/firebase/carts.service';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import CustomeStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-carts',
    templateUrl: './carts.component.html',
    styleUrls: ['./carts.component.scss']
})
export class CartsComponent implements OnInit {
    cartSource;
    lang = localStorage.getItem('lang') === 'ar';
    shipmentData: any[] = [];

    constructor(private cartService: CartsService, private router: Router, private toastr: ToastrService) {
        this.cartService.getCarts().subscribe(res => {
            res.map(cart => {
                cart.itemsArray = Object.keys(cart.items).map(code => {
                    return {code: code, name: 'ali', qty: cart.items[code]};
                });
            });
            this.cartSource = res;
        });
    }

    ngOnInit() {
    }

    addBill(event, data) {
        /* wire up file reader */
        const target: DataTransfer = <DataTransfer>(event.target);
        if (target.files.length !== 1) {
            throw new Error('Cannot use multiple files');
        }
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            /* read workbook */
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
            /* grab first sheet */
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            /* save data */
            const ArrayFromXLSX = XLSX.utils.sheet_to_json(ws, {
                header:
                    ['no', 'barCodeId', 'code', 'nameArFull', 'Qty', 'freeQty', 'unitNameAr', 'pricePerPiece', 'total']
            }).slice(1);

            ArrayFromXLSX.forEach(item => {
                let oldItem = data.items.find(x => x.code === item['code']);
                oldItem.shippedQty += item['Qty'];
                let newItems = data.items.filter(x => x.code !== item['code']);
                newItems.push(oldItem);
                this.cartService.updateCart(data.id, {items: newItems});
                this.cartService.addShipment(data.id, item);
            });
        };
        reader.readAsBinaryString(target.files[0]);
    }

    getShipments(event) {
        event.component.collapseAll(-1);
        this.cartService.getShipments(event.key).subscribe(res => {
            this.shipmentData = res;
        });

    }
}
