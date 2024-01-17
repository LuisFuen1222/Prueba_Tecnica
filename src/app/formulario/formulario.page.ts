import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmpleadoService } from '../empleado.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-formulario',
  templateUrl: './formulario.page.html',
  styleUrls: ['./formulario.page.scss'],
})
export class FormularioPage implements OnInit {
  form: FormGroup;
  empleadoIndex: number | null = null;
  cargos = [
    { id: 1, descripcion: 'Gerente' },
    { id: 2, descripcion: 'Coordinador' },
    { id: 3, descripcion: 'Subdirector' },
    { id: 4, descripcion: 'Administración' },
    { id: 5, descripcion: 'Ventas' },
    { id: 6, descripcion: 'Dirección' },
    { id: 7, descripcion: 'Recursos humanos' }
  ];
  empleados$ = this.empleadoService.empleados$;

  filtro = '';
  pagina = 0;
  elementosPorPagina = 5;

  constructor(
    private fb: FormBuilder,
    private empleadoService: EmpleadoService,
    private alertController: AlertController
  ) {
    this.form = this.fb.group({
      nombreCompleto: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      edad: [{ value: '', disabled: true }, Validators.required], // Deshabilita el campo de edad
      cargo: ['', Validators.required],
      estatus: [true]
    });

     // Suscribirse a cambios en la fecha de nacimiento si existe el control
     const fechaNacimientoControl = this.form.get('fechaNacimiento');
     if (fechaNacimientoControl) {
       fechaNacimientoControl.valueChanges.subscribe(() => {
         this.calcularEdad();
       });
     }
   }
 
   ngOnInit() {}
 
   calcularEdad() {
    const fechaNacimientoControl = this.form.get('fechaNacimiento');
    const edadControl = this.form.get('edad');
  
    if (fechaNacimientoControl && fechaNacimientoControl.value && edadControl) {
      const fechaNacimiento = fechaNacimientoControl.value;
      const hoy = new Date();
      const fechaNac = new Date(fechaNacimiento);
      const edad = hoy.getFullYear() - fechaNac.getFullYear();
      
      // Actualiza el valor en el formulario
      edadControl.setValue(edad);
  
      // Si estás editando un empleado existente, actualiza la edad en la lista de empleados
      if (this.empleadoIndex !== null) {
        const empleadoActualizado = { ...this.form.value, edad };
        this.empleadoService.editarEmpleado(this.empleadoIndex, empleadoActualizado);
      }
    }
  }
  

  agregarEmpleado() {
    if (this.empleadoIndex !== null) {
      // Si estamos editando un empleado, actualiza el empleado existente
      this.empleadoService.editarEmpleado(this.empleadoIndex, this.form.value);
      this.empleadoIndex = null;
    } else {
      // Si estamos agregando un nuevo empleado, agrega el empleado
      const empleadoConId = {
        ...this.form.value,
        id: Math.floor(Math.random() * 1000) // Genera un número aleatorio entre 0 y 9999
      };
      this.empleadoService.agregarEmpleado(empleadoConId);
    }
    this.form.reset({ estatus: true });
  }

  // Acepta la fecha de nacimiento y devuelve la edad
  calcularEdadDesdeFechaNacimiento(fechaNacimiento: string): number {
    if (!fechaNacimiento) {
      return 0;
    }
  
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
  
    return edad;
  }  

  // Agrega una nueva función para iniciar la edición de un empleado
  async iniciarEdicionEmpleado(index: number, empleado: any) {
    if (!empleado.estatus) {
      this.empleadoIndex = index;
      this.form.patchValue(empleado);
    } else {
      const alert = await this.alertController.create({
        header: 'Alerta',
        message: 'No se puede editar un empleado con estatus activo',
        buttons: ['OK']
      });

      await alert.present();
    }
  }

  editarEmpleado(index: number, empleado: any) {
    this.empleadoService.editarEmpleado(index, empleado);
  }

  eliminarEmpleado(index: number) {
    this.empleadoService.eliminarEmpleado(index);
  }

  cambiarEstatus(index: number) {
    this.empleadoService.cambiarEstatus(index);
  }

  getCargoDescripcion(id: number): string {
    const cargo = this.cargos.find(cargo => cargo.id === id);
    return cargo ? cargo.descripcion : '';
  }

  get empleadosFiltrados() {
    let empleados: any[] = [];
    this.empleados$.subscribe(data => {
      empleados = data;
    });
    return empleados.filter((empleado: any) =>
      empleado.nombreCompleto.includes(this.filtro) ||
      empleado.id.toString().includes(this.filtro) ||
      this.getCargoDescripcion(empleado.cargo).includes(this.filtro)
    );
  }

  paginaAnterior() {
    if (this.pagina > 0) {
      this.pagina--;
    }
  }
  
  paginaSiguiente() {
    if (this.pagina < (this.empleadosFiltrados.length / this.elementosPorPagina) - 1) {
      this.pagina++;
    }
  }
}
