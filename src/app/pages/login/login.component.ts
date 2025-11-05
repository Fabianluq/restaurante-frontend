import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
  this.loginForm = this.fb.group({ correo: ['', [Validators.required, Validators.email]], contrasenia: ['', Validators.required] });

  if (this.auth.isAuthenticated()) {
    void this.router.navigate(['/dashboard']);
  }
}



  get correo() { return this.loginForm.get('correo'); }
  get contrasenia() { return this.loginForm.get('contrasenia'); }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    const payload: LoginRequest = {
      correo: this.loginForm.value.correo,
      contrasenia: this.loginForm.value.contrasenia
    };

    try {
      const res = await this.auth.login(payload);

      if (res?.token) {
        this.router.navigate(['/dashboard']);
        return;
      }

      // Asegurar que siempre se muestre un mensaje amigable
      const errorMsg = res?.error;
      if (errorMsg) {
        // Si el error es un objeto, convertirlo a string amigable
        if (typeof errorMsg === 'object') {
          this.errorMessage.set('Error al iniciar sesión. Verifica tus credenciales.');
        } else {
          this.errorMessage.set(String(errorMsg));
        }
      } else {
        this.errorMessage.set('Error al iniciar sesión. Intenta nuevamente.');
      }
    } catch (err: any) {
      // Manejar errores de conexión o inesperados
      const message = err?.message ?? String(err);
      if (message.includes('401') || message.includes('Unauthorized')) {
        this.errorMessage.set('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (message.includes('Network') || message.includes('Failed to fetch')) {
        this.errorMessage.set('Error de conexión. Verifica tu conexión a internet.');
      } else {
        this.errorMessage.set('Error al iniciar sesión. Intenta más tarde.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
