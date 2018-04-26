import * as ts from "typescript";
import { LazyGetter } from "typescript-lazy-get-decorator";

import { AstDeclarationBase, AstDeclarationBaseDto } from "./ast-declaration-base";
import { GatheredMembersResult, AstItemGatherMembersOptions, GatheredMember, GatheredMemberReference } from "../contracts/ast-item";
import { AstSymbol } from "./ast-symbol";
import { AstType } from "./ast-type-base";

export interface AstCallableGatheredResult extends GatheredMembersResult {
    parameters: Array<GatheredMember<AstSymbol>>;
    typeParameters: Array<GatheredMember<AstSymbol>>;
    returnType?: GatheredMember<AstType>;
}

export interface AstCallableBaseDto extends AstDeclarationBaseDto {
    typeParameters: GatheredMemberReference[];
    parameters: GatheredMemberReference[];
    isOverloadBase: boolean;
    returnType?: GatheredMemberReference;
}

export abstract class AstCallableBase<
    TDeclaration extends ts.SignatureDeclaration,
    TGatherResult extends AstCallableGatheredResult,
    TExtractedData extends AstCallableBaseDto = AstCallableBaseDto
> extends AstDeclarationBase<TDeclaration, TGatherResult, TExtractedData> {
    @LazyGetter()
    public get name(): string {
        if (this.item.name != null) {
            return this.item.name.getText();
        }

        // Fallback to a Symbol name.
        return this.parent.name;
    }

    @LazyGetter()
    public get isOverloadBase(): boolean {
        return this.typeChecker.isImplementationOfOverload(this.item as ts.FunctionLike) || false;
    }

    public get typeParameters(): AstSymbol[] {
        return this.gatheredMembers.typeParameters.map(x => x.item);
    }

    public get parameters(): AstSymbol[] {
        return this.gatheredMembers.parameters.map(x => x.item);
    }

    public get returnType(): AstType | undefined {
        if (this.gatheredMembers.returnType == null) {
            return undefined;
        }

        return this.gatheredMembers.returnType.item;
    }

    protected onGatherMembers(options: AstItemGatherMembersOptions): TGatherResult {
        const result: AstCallableGatheredResult = {
            parameters: this.getMembersFromDeclarationList(options, this.item.parameters),
            typeParameters: this.getMembersFromDeclarationList(options, this.item.typeParameters || [])
        };

        // Resolved return Type.
        const signature = this.typeChecker.getSignatureFromDeclaration(this.item);
        if (signature != null) {
            const type = this.typeChecker.getReturnTypeOfSignature(signature);

            const returnAstType = this.options.resolveAstType(type, undefined, { parentId: this.id });
            if (!this.options.itemsRegistry.hasItemById(returnAstType.id)) {
                options.addAstItemToRegistry(returnAstType);
            }

            result.returnType = {
                item: returnAstType
            };
        }

        return result as TGatherResult;
    }
}
